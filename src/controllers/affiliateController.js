const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const AffiliateService = require("../services/affiliateService");
const { sendResponse } = require("../utils/sendResponse");
const affiliateService = new AffiliateService();
const PaymentService = require("../services/paymentService");
const paymentService = new PaymentService();
// Affiliate Sign Up
exports.signUp = catchAsyncError(async (req, res, next) => {
  const user = await affiliateService.signUp(req.body);
  sendResponse(
    res,
    true,
    returnMessage("auth", "registered"),
    user,
    statusCode.success
  );
});

// Affiliate Log In
exports.login = catchAsyncError(async (req, res, next) => {
  const user = await affiliateService.logIn(req.body);
  sendResponse(
    res,
    true,
    returnMessage("auth", "loggedIn"),
    user,
    statusCode.success
  );
});

// Affiliate Change Password
exports.changePassword = catchAsyncError(async (req, res, next) => {
  await affiliateService.changePassword(req.body, req.user._id);
  sendResponse(
    res,
    true,
    returnMessage("auth", "passwordChanged"),
    null,
    statusCode.success
  );
});

// Get Profile
exports.getProfile = catchAsyncError(async (req, res, next) => {
  const user = await affiliateService.getProfile(req?.user);
  sendResponse(
    res,
    true,
    returnMessage("affiliate", "getProfile"),
    user,
    statusCode.success
  );
});

// Update Profile
exports.updateProfile = catchAsyncError(async (req, res, next) => {
  await affiliateService.updateProfile(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("affiliate", "userUpdated"),
    null,
    statusCode.success
  );
});

// Affiliate Forgot Password
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  await affiliateService.forgotPassword(req.body);
  sendResponse(
    res,
    true,
    returnMessage("auth", "resetPasswordMailSent"),
    null,
    statusCode.success
  );
});

// Affiliate Reset Password
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  await affiliateService.resetPassword(req.body);
  sendResponse(
    res,
    true,
    returnMessage("auth", "resetPassword"),
    null,
    statusCode.success
  );
});

// Affiliate Dashboard Data
exports.getDashboardData = catchAsyncError(async (req, res, next) => {
  const dashboardData = await affiliateService.getDashboardData(req?.user);
  sendResponse(
    res,
    true,
    returnMessage("affiliate", "dashboardDataFetched"),
    dashboardData,
    statusCode.success
  );
});

// Affiliate Click Count
exports.clickCount = catchAsyncError(async (req, res, next) => {
  const dashboardData = await affiliateService.clickCount(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("affiliate", "countAdded"),
    dashboardData,
    statusCode.success
  );
});

exports.requestPayout = catchAsyncError(async (req, res, next) => {
  const requestPayout = await paymentService.requestforPayout(
    req.user,
    req.body
  );
  sendResponse(
    res,
    true,
    returnMessage("payment", "requestPayout"),
    requestPayout,
    200
  );
});

exports.createFundAccount = catchAsyncError(async (req, res, next) => {
  const fund_detail = await paymentService.creatFundAccount(req.body, req.user);
  sendResponse(
    res,
    true,
    returnMessage("payment", "createFundAccount"),
    fund_detail,
    200
  );
});

exports.fetchaccount = catchAsyncError(async (req, res, next) => {
  const fetchaccount = await paymentService.fetchAccountDetail(req.user);
  sendResponse(
    res,
    true,
    returnMessage("payment", "subscriptionFetched"),
    fetchaccount,
    200
  );
});
