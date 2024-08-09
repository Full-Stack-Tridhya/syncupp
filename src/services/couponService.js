const AdminCoupon = require("../models/adminCouponSchema");
const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const { returnMessage, paginationObject } = require("../utils/utils");
const Agency = require("../models/agencySchema");
const Configuration = require("../models/configurationSchema");
const Team_Agency = require("../models/teamAgencySchema");
const Role_Master = require("../models/masters/roleMasterSchema");

class CouponService {
  // Add Coupon
  addCoupon = async (payload, files) => {
    try {
      const { brand, couponCode, discountTitle, siteURL } = payload;

      let couponImageFileName;
      if (files?.fieldname === "brandLogo") {
        couponImageFileName = "uploads/" + files?.filename;
      }
      const newCoupon = new AdminCoupon({
        brand,
        couponCode,
        discountTitle,
        siteURL,
        brandLogo: couponImageFileName,
      });

      return newCoupon.save();
    } catch (error) {
      logger.error(`Error while Admin add Coupon, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // GET All FQA
  getAllCoupon = async (searchObj) => {
    try {
      const queryObj = { is_deleted: false };

      if (searchObj.search && searchObj.search !== "") {
        queryObj["$or"] = [
          {
            brand: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            couponCode: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            discountTitle: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            siteURL: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
        ];
      }

      const pagination = paginationObject(searchObj);

      const [coupon, totalcoupon] = await Promise.all([
        AdminCoupon.find(queryObj)
          .select("brand couponCode discountTitle siteURL brandLogo")
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page)
          .lean(),
        AdminCoupon.countDocuments(queryObj),
      ]);

      return {
        coupon,
        page_count: Math.ceil(totalcoupon / pagination.result_per_page) || 0,
      };
    } catch (error) {
      logger.error(`Error  while fetching coupon list, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Delete Coupon
  deleteCoupon = async (payload) => {
    const { couponIdsToDelete } = payload;
    try {
      const deletedFaqs = await AdminCoupon.updateMany(
        { _id: { $in: couponIdsToDelete } },
        { $set: { is_deleted: true } }
      );
      return deletedFaqs;
    } catch (error) {
      logger.error(`Error while Deleting coupon, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Update Coupon
  updateCoupon = async (payload, faqId, files) => {
    try {
      const { brand, couponCode, discountTitle, siteURL } = payload;
      let couponImageFileName;
      if (files?.fieldname === "brandLogo") {
        couponImageFileName = "uploads/" + files?.filename;
      }

      const faq = await AdminCoupon.findByIdAndUpdate(
        {
          _id: faqId,
        },
        {
          brand,
          couponCode,
          discountTitle,
          siteURL,
          brandLogo: couponImageFileName,
        },
        { new: true, useFindAndModify: false }
      );
      return faq;
    } catch (error) {
      logger.error(`Error while updating coupon, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // GET Coupon
  getCoupon = async (faqId) => {
    try {
      const queryObj = { is_deleted: false };

      // if (searchObj.search && searchObj.search !== "") {
      //   queryObj["$or"] = [
      //     {
      //       brand: {
      //         $regex: searchObj.search.toLowerCase(),
      //         $options: "i",
      //       },
      //     },
      //     {
      //       discountTitle: {
      //         $regex: searchObj.search.toLowerCase(),
      //         $options: "i",
      //       },
      //     },
      //     {
      //       couponCode: {
      //         $regex: searchObj.search.toLowerCase(),
      //         $options: "i",
      //       },
      //     },
      //   ];
      // }

      const faq = await AdminCoupon.findById({
        _id: faqId,
        is_deleted: false,
      }).lean();
      return faq;
    } catch (error) {
      logger.error(`Error while Get FQA, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  getAllCouponWithOutPagination = async (query, user) => {
    try {
      const coupon_count = query?.coupon_count || 0;
      const member_details = user?.workspace_detail?.members?.find(
        (member) =>
          member?.user_id?.toString() === user?._id?.toString() &&
          member?.status === "confirmed"
      );
      let [role, configuration, coupon] = await Promise.all([
        Role_Master.findById(member_details?.role).lean(),
        Configuration.findOne().lean(),
        AdminCoupon.find({ is_deleted: false }).select("-couponCode").lean(),
      ]);

      if (role?.name !== "agency" && role?.name !== "team_agency") return;

      member_details.total_coupon = member_details?.total_coupon?.map((cp) =>
        cp?.toString()
      );

      if (member_details?.total_coupon?.length > 0 && coupon_count > 0)
        coupon = coupon.filter(
          (couponItem) =>
            !member_details?.total_coupon.includes(couponItem?._id?.toString())
        );

      const totalCouponIds = member_details?.total_coupon?.map((coupon) =>
        coupon?.toString()
      );

      for (let i = 0; i < coupon.length; i++) {
        const couponId = coupon[i]?._id?.toString();
        // Check if the coupon ID exists in agency_data.total_coupon
        const isAvailable = totalCouponIds?.includes(couponId);
        // Add a flag to the coupon object
        coupon[i].isAvailable = !isAvailable;
      }

      return {
        coupon: coupon_count > 0 ? coupon.slice(0, coupon_count) : coupon,
        require_points: configuration?.coupon?.reedem_coupon,
      };
    } catch (error) {
      logger.error(`Error whilefetching coupon list, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  getMyCoupons = async (user) => {
    try {
      const member_detail = user?.workspace_detail?.members?.find(
        (member) =>
          member?.user_id?.toString() === user?._id?.toString() &&
          member?.status === "confirmed"
      );
      return await AdminCoupon.find({
        _id: { $in: member_detail?.total_coupon },
      });
    } catch (error) {
      logger.error(`Error while fetching coupon list, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = CouponService;
