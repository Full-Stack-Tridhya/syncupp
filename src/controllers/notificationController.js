const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const NotificationService = require("../services/notificationService");
const { sendResponse } = require("../utils/sendResponse");
const notificationService = new NotificationService();

// create ------

exports.addNotification = catchAsyncError(async (req, res, next) => {
  const notification = await notificationService.addAdminNotification(
    req?.body
  );
  sendResponse(
    res,
    true,
    returnMessage("notification", "messageAdded"),
    notification,
    statusCode.success
  );
});

// Get Notification ------

exports.getNotification = catchAsyncError(async (req, res, next) => {
  const notification = await notificationService.getNotification(
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

// Read notification ------

exports.readNotification = catchAsyncError(async (req, res, next) => {
  const notification = await notificationService.readNotification(
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

exports.dashboardNotification = catchAsyncError(async (req, res, next) => {
  const notification = await notificationService.dashBoardNotification(
    req?.user
  );
  sendResponse(res, true, null, notification, statusCode.success);
});
