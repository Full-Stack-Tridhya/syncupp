const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const {
  paginationObject,
  capitalizeFirstLetter,
  validateRequestFields,
} = require("../utils/utils");
const Authentication = require("../models/authenticationSchema");
const SubscriptionPlan = require("../models/subscriptionplanSchema");
const moment = require("moment");
const PaymentService = require("../services/paymentService");
const paymentService = new PaymentService();
const fs = require("fs");
const axios = require("axios");
const Workspace = require("../models/workspaceSchema");
// Register Agency
class AgencyService {
  // this will only avilabe for the admin panel
  allAgencies = async (payload) => {
    try {
      const pagination = paginationObject(payload);
      const query_obj = {};

      if (payload?.filter) {
        const { status, profession_role, no_of_people, date } = payload?.filter;
        if (status && status !== "") query_obj["status"] = status;
        if (profession_role && profession_role !== "") {
          if (profession_role === "Other") {
            query_obj["$and"] = [
              { profession_role: { $ne: "Agency" } },
              { profession_role: { $ne: "Freelancer" } },
            ];
          } else query_obj["profession_role"] = profession_role;
        }
        if (no_of_people && no_of_people !== "")
          query_obj["no_of_people"] = no_of_people;
        if (date && date !== "") {
          const start_date = moment(date?.start_date, "DD-MM-YYYY").startOf(
            "day"
          );
          const end_date = moment(date?.end_date, "DD-MM-YYYY").endOf("day");

          query_obj["$and"] = [
            { createdAt: { $gte: new Date(start_date) } },
            { createdAt: { $lte: new Date(end_date) } },
          ];
        }
      }

      if (payload.search && payload.search !== "") {
        query_obj["$or"] = [
          { first_name: { $regex: payload.search, $options: "i" } },
          { last_name: { $regex: payload.search, $options: "i" } },
          { email: { $regex: payload.search, $options: "i" } },
          { contact_number: { $regex: payload.search, $options: "i" } },
          { company_name: { $regex: payload.search, $options: "i" } },
          { company_website: { $regex: payload.search, $options: "i" } },
          { no_of_people: { $regex: payload.search, $options: "i" } },
          { profession_role: { $regex: payload.search, $options: "i" } },
          { status: { $regex: payload.search, $options: "i" } },
          { workspace_name: { $regex: payload.search, $options: "i" } },
        ];

        // const keyword_type = getKeywordType(payload.search);
        // if (keyword_type === "number") {
        //   query_obj["$or"].push({ contact_number: parseInt(payload.search) });
        // }
      }

      const aggragate = [
        { $match: { is_deleted: false } },
        { $unwind: { path: "$members", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$members.user_id", "$created_by"] },
                { $eq: ["$_id", "$_id"] }, // Ensures the matching is within the same workspace
              ],
            },
          },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "created_by",
            foreignField: "_id",
            as: "created_by",
            pipeline: [
              {
                $project: {
                  company_name: 1,
                  company_website: 1,
                  profession_role: 1,
                  no_of_people: 1,
                  first_name: 1,
                  last_name: 1,
                  email: 1,
                  contact_number: 1,
                  name: { $concat: ["$first_name", " ", "$last_name"] },
                  _id: 1,
                  createdAt: 1,
                  purchased_plan: 1,
                },
              },
            ],
          },
        },
        { $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: "$created_by._id",
            company_name: "$created_by.company_name",
            company_website: "$created_by.company_website",
            profession_role: "$created_by.profession_role",
            createdAt: "$created_by.createdAt",
            no_of_people: "$created_by.no_of_people",
            first_name: "$created_by.first_name",
            last_name: "$created_by.last_name",
            email: "$created_by.email",
            contact_number: "$created_by.contact_number",
            name: "$created_by.name",
            trial_end_date: 1,
            status: "$members.status",
            workspace_name: "$name",
            purchased_plan: "$created_by.purchased_plan",
            is_deleted: 1,
            workspace_id: "$_id",
          },
        },
        { $match: query_obj },
      ];

      const [agencyList, total_agencies] = await Promise.all([
        Workspace.aggregate(aggragate)
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page),
        Workspace.aggregate(aggragate),
      ]);

      return {
        agencyList,
        page_count:
          Math.ceil(total_agencies.length / pagination.result_per_page) || 0,
      };
    } catch (error) {
      logger.error(`Error while getting agency list: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // admin only have rights to update the status and delete
  updateAgencyStatus = async (payload) => {
    try {
      const update_obj = {};
      if (payload?.status && payload?.status !== "") {
        if (payload.status === "active") update_obj.status = "confirmed";
        else if (payload.status === "inactive") update_obj.status = "inactive";
      } else if (payload?.delete) update_obj.is_deleted = true;

      if (payload?.delete) {
        payload?.agencies?.map((agency) => {
          paymentService.deactivateAgency(
            agency?.agency_id,
            agency?.workspace_id
          );
        });
      } else {
        payload?.agencies?.map(async (agency) => {
          await Workspace.updateMany(
            { created_by: agency, "members.user_id": agency },
            { $set: { "members.$.status": update_obj.status } },
            { new: true }
          );
        });
      }
      return true;
    } catch (error) {
      logger.error(`Error while updating an agency status: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Get Agency profile
  getAgencyProfile = async (agency) => {
    try {
      const [agency_detail, plan] = await Promise.all([
        Authentication.findById(agency?._id)
          .populate("purchased_plan", "plan_type")
          .populate("country", "name")
          .populate("state", "name")
          .populate("city", "name")
          .select("-password")
          .lean(),
        SubscriptionPlan.findOne({ active: true }).lean(),
      ]);
      // removed because of the subscription api is gettign cancelled due to razorpay api call
      // const [subscription_detail, check_referral] = await Promise.all([
      //   paymentService.subscripionDetail(agency_detail?.subscription_id),
      //   referralService.checkReferralAvailable(agency),
      // ]);
      // agency_detail.payable_amount = (
      //   paymentService.customPaymentCalculator(
      //     subscription_detail?.current_start,
      //     subscription_detail?.current_end,
      //     plan
      //   ) / 100
      // ).toFixed(2);
      // // let check_referral = await referralService.checkReferralAvailable(agency);
      // agency_detail.check_referral = check_referral.referralAvailable;
      return agency_detail;
    } catch (error) {
      logger.error(`Error while registering the agency: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Update profile
  updateProfile = async (payload, user, image) => {
    try {
      let {
        first_name,
        last_name,
        contact_number,
        company_name,
        company_website,
        no_of_people,
        industry,
        city,
        address,
        state,
        country,
        pincode,
        profession_role,
        bio,
      } = payload;

      let profile_image;

      if (country == "null" || country == "undefined") country = null;
      if (state == "null" || state == "undefined") state = null;
      if (city == "null" || city == "undefined") city = null;
      if (company_website == "null" || company_website == "undefined")
        company_website = null;

      const existingImage = user?.profile_image;

      if (image) {
        profile_image = image?.filename;
      } else if (
        payload?.profile_image === "" ||
        (image === undefined && !payload?.profile_image)
      ) {
        profile_image = null;
        existingImage &&
          fs.unlink(`./src/public/${existingImage}`, (err) => {
            if (err) {
              logger.error(`Error while unlinking the documents: ${err}`);
            }
          });
      }

      await Authentication.findByIdAndUpdate(user?._id, {
        company_name,
        company_website,
        no_of_people,
        industry,
        city,
        address,
        state,
        country,
        pincode,
        first_name,
        last_name,
        contact_number,
        profile_image,
        bio,
        profession_role,
      });

      return;
    } catch (error) {
      logger.error(`Error while registering the agency: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  glideCampaignContactUpdate = async (glide_campaign_id, payload) => {
    try {
      if (!glide_campaign_id) return;

      const submission_id = await axios.get(
        process.env.GLIDE_CAMPAIGN_CONTACT_UPDATE_URL +
          "/" +
          glide_campaign_id +
          "/submission",
        {
          auth: {
            username: process.env.GLIDE_PUBLICE_KEY,
            password: process.env.GLIDE_PRIVATE_KEY,
          },
        }
      );

      if (!submission_id?.data?.data[0]?.submission_id) return;

      const contact_update_object = {
        form_data: {
          first_name: capitalizeFirstLetter(payload?.first_name),
          last_name: capitalizeFirstLetter(payload?.last_name),
          phone:
            payload?.contact_number?.length <= 10
              ? "91" + payload?.contact_number
              : payload?.contact_number,
          company: capitalizeFirstLetter(payload?.company_name),
          website:
            payload?.company_website &&
            payload?.company_website !== "null" &&
            payload?.company_website !== "undefined"
              ? payload?.website
              : undefined,
          role: "Agency",
          no_of_people:
            payload?.no_of_people &&
            payload?.no_of_people !== "null" &&
            payload?.no_of_people !== "undefined"
              ? payload?.no_of_people
              : undefined,
          industry:
            payload?.industry &&
            payload?.industry !== "null" &&
            payload?.industry !== "undefined"
              ? payload?.industry
              : undefined,
        },
      };

      await axios.put(
        process.env.GLIDE_CAMPAIGN_CONTACT_UPDATE_URL +
          "/" +
          glide_campaign_id +
          "/submission/" +
          submission_id?.data?.data[0]?.submission_id,
        contact_update_object,
        {
          auth: {
            username: process.env.GLIDE_PUBLICE_KEY,
            password: process.env.GLIDE_PRIVATE_KEY,
          },
        }
      );

      return;
    } catch (error) {
      console.log(error);
      logger.error(
        `Error while creating the contact in the glide campaign: ${error}`
      );
    }
  };
}

module.exports = AgencyService;
