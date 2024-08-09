const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const AdminService = require("../services/adminService");
const { sendResponse } = require("../utils/sendResponse");
const AgencyService = require("../services/agencyService");
const adminService = new AdminService();
const agencyService = new AgencyService();
const PaymentService = require("../services/paymentService");
const paymentService = new PaymentService();
const WorkspaceService = require("../services/workspaceService");
const workspaceServie = new WorkspaceService();

exports.login = catchAsyncError(async (req, res, next) => {
  const admin = await adminService.login(req.body);
  sendResponse(
    res,
    true,
    returnMessage("auth", "loggedIn"),
    admin,
    statusCode.success
  );
});

// getAdmin

exports.getAdmin = catchAsyncError(async (req, res, next) => {
  const admin = await adminService.getAdmin(req?.user?._id);
  if (admin) {
    sendResponse(
      res,
      true,
      returnMessage("admin", "adminFetched"),
      admin,
      statusCode.success
    );
  }
});

// forgotPassword
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const admin = await adminService.forgotPassword(req.body);

  sendResponse(
    res,
    true,
    returnMessage("admin", "emailSent"),
    admin,
    statusCode.success
  );
});

// resetPassword

exports.resetPassword = catchAsyncError(async (req, res, next) => {
  await adminService.resetPassword(req.body);

  sendResponse(
    res,
    true,
    returnMessage("admin", "resetPassword"),
    null,
    statusCode.success
  );
});

//Update password

exports.changePassword = catchAsyncError(async (req, res, next) => {
  await adminService.changePassword(req.body, req?.user?._id);

  sendResponse(
    res,
    true,
    returnMessage("admin", "passwordUpdated"),
    null,
    statusCode.success
  );
});

//  Update admin

exports.updateAdmin = catchAsyncError(async (req, res, next) => {
  const admin = await adminService.updateAdmin(req.body, req?.user?._id);
  sendResponse(
    res,
    true,
    returnMessage("admin", "updated"),
    admin,
    statusCode.success
  );
});

//  Get Agency

exports.getAgency = catchAsyncError(async (req, res, next) => {
  const admin = await agencyService.getAgencyProfile(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("admin", "agencyFetched"),
    admin,
    statusCode.success
  );
});

// below function is used to get the transaction history of the Agency
exports.transactionHistory = catchAsyncError(async (req, res, next) => {
  const transactions = await adminService.transactionHistory(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("admin", "transactionFetched"),
    transactions,
    statusCode.success
  );
});

// Dashboard
exports.dashboardData = catchAsyncError(async (req, res, next) => {
  const dashboardData = await adminService.dashboardData(req?.user);

  sendResponse(
    res,
    true,
    returnMessage("agency", "dashboardDataFetched"),
    dashboardData,
    statusCode.success
  );
});

// Dashboard
exports.agencyDownload = catchAsyncError(async (req, res, next) => {
  await adminService.agencyDownload(res);
});
exports.PendingPayout = catchAsyncError(async (req, res, next) => {
  const PendingPayout = await paymentService.pendingpayout(req.body);
  sendResponse(
    res,
    true,
    returnMessage("payment", "payoutlist"),
    PendingPayout,
    200
  );
});

exports.createPayout = catchAsyncError(async (req, res, next) => {
  const createPayout = await paymentService.createPayouts(req.body);
  sendResponse(
    res,
    true,
    returnMessage("payment", "createPayout"),
    createPayout,
    200
  );
});

exports.paymentDownload = catchAsyncError(async (req, res, next) => {
  await adminService.paymentHistoryDownload(res);
});

//  Update admin
exports.extendTrialPeriod = catchAsyncError(async (req, res, next) => {
  await workspaceServie.updateTrialEndDate(req.body);
  sendResponse(
    res,
    true,
    returnMessage("workspace", "trialExtended"),
    {},
    statusCode.success
  );
});

exports.agencyPaymentDetail = catchAsyncError(async (req, res, next) => {
  const payment_detail = await paymentService.agencyPaymentDetail(
    req.params.agency_id
  );
  sendResponse(res, true, undefined, payment_detail, statusCode.success);
});

exports.manualPayment = catchAsyncError(async (req, res, next) => {
  await paymentService.manualPayment(req.body);
  sendResponse(
    res,
    true,
    returnMessage("admin", "manualPaymentCompleted"),
    {},
    statusCode.success
  );
});

// Get Notification ------

exports.getNotification = catchAsyncError(async (req, res, next) => {
  const notification = await adminService.getAllNotification(
    req?.user,
    req?.query
  );
  sendResponse(
    res,
    true,
    returnMessage("notification", "notificationFetched"),
    notification,
    statusCode.success
  );
});

exports.readNotification = catchAsyncError(async (req, res, next) => {
  const notification = await adminService.readNotification(
    req?.body,
    req?.user
  );
  sendResponse(
    res,
    true,
    returnMessage("notification", "notificationRead"),
    notification,
    statusCode.success
  );
});
