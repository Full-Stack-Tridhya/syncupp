const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const ClientReviewService = require("../services/adminClientReviewService");
const { sendResponse } = require("../utils/sendResponse");
const clientReviewService = new ClientReviewService();

// Add Client Review
exports.addClientReview = catchAsyncError(async (req, res, next) => {
  const addedClientReview = await clientReviewService.addClientReview(
    req.body,
    req.file
  );
  sendResponse(
    res,
    true,
    returnMessage("admin", "clientReviewAdded"),
    addedClientReview,
    statusCode.success
  );
});

// get All Client Review
exports.getAllClientReview = catchAsyncError(async (req, res, next) => {
  const clientReviews = await clientReviewService.getAllClientReview(req.body);
  sendResponse(
    res,
    true,
    returnMessage("admin", "getAllClientReview"),
    clientReviews,
    statusCode.success
  );
});

// delete Client Review
exports.deleteClientReview = catchAsyncError(async (req, res, next) => {
  await clientReviewService.deleteClientReview(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("admin", "deleteClientReview"),
    null,
    statusCode.success
  );
});

// Update Client Review
exports.updateClientReview = catchAsyncError(async (req, res, next) => {
  const updatedClientReview = await clientReviewService.updateClientReview(
    req.body,
    req?.params?.id,
    req.file
  );
  sendResponse(
    res,
    true,
    returnMessage("admin", "clientReviewUpdated"),
    updatedClientReview,
    statusCode.success
  );
});

// Get Client Review BY ID
exports.getClientReviewByID = catchAsyncError(async (req, res, next) => {
  const getClientReviewByID = await clientReviewService.getClientReviewByID(
    req?.params?.id
  );
  sendResponse(
    res,
    true,
    returnMessage("admin", "getClientReviewByID"),
    getClientReviewByID,
    statusCode.success
  );
});
