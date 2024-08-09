const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const CouponService = require("../services/couponService");
const { sendResponse } = require("../utils/sendResponse");
const couponService = new CouponService();

// Add coupon

exports.addCoupon = catchAsyncError(async (req, res, next) => {
  const addedCoupen = await couponService.addCoupon(req.body, req.file);
  sendResponse(
    res,
    true,
    returnMessage("admin", "couponAdded"),
    addedCoupen,
    statusCode.success
  );
});

// // get All FQA

exports.getCouponList = catchAsyncError(async (req, res, next) => {
  const getCouponList = await couponService.getAllCoupon(req.body);
  sendResponse(
    res,
    true,
    returnMessage("admin", "getAllCoupon"),
    getCouponList,
    statusCode.success
  );
});

// delete coupon

exports.deleteCoupon = catchAsyncError(async (req, res, next) => {
  await couponService.deleteCoupon(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("admin", "deleteCoupon"),
    null,
    statusCode.success
  );
});

// Update coupon

exports.updateCoupon = catchAsyncError(async (req, res, next) => {
  const updatedFaq = await couponService.updateCoupon(
    req.body,
    req?.params?.id,
    req.file
  );
  sendResponse(
    res,
    true,
    returnMessage("admin", "couponUpdated"),
    updatedFaq,
    statusCode.success
  );
});

// Get coupon

exports.getCoupon = catchAsyncError(async (req, res, next) => {
  const getCoupon = await couponService.getCoupon(req?.params?.id);
  sendResponse(
    res,
    true,
    returnMessage("admin", "getCoupon"),
    getCoupon,
    statusCode.success
  );
});

exports.getAllCouponWithOutPagination = catchAsyncError(
  async (req, res, next) => {
    const getAllCouponWithOutPagination =
      await couponService.getAllCouponWithOutPagination(req?.query, req?.user);
    sendResponse(
      res,
      true,
      returnMessage("admin", "getAllCoupon"),
      getAllCouponWithOutPagination,
      statusCode.success
    );
  }
);

exports.getmyCoupon = catchAsyncError(async (req, res, next) => {
  const getMyCoupons = await couponService.getMyCoupons(req?.user);

  sendResponse(
    res,
    true,
    returnMessage("admin", "getMyCoupons"),
    getMyCoupons,
    statusCode.success
  );
});
