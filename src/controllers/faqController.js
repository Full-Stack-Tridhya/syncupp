const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const FaqService = require("../services/faqService");
const { sendResponse } = require("../utils/sendResponse");
const faqService = new FaqService();

// Add FAQ

exports.addFaq = catchAsyncError(async (req, res, next) => {
  const addedFaq = await faqService.addFaq(req.body);
  sendResponse(
    res,
    true,
    returnMessage("admin", "faqAdded"),
    addedFaq,
    statusCode.success
  );
});

// get All FQA

exports.getAllFaq = catchAsyncError(async (req, res, next) => {
  const faqs = await faqService.getAllFaq(req.body);
  sendResponse(
    res,
    true,
    returnMessage("admin", "getAllFaq"),
    faqs,
    statusCode.success
  );
});

// delete FQA

exports.deleteFaq = catchAsyncError(async (req, res, next) => {
  await faqService.deleteFaq(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("admin", "deleteFaq"),
    null,
    statusCode.success
  );
});

// Update FQA

exports.updateFaq = catchAsyncError(async (req, res, next) => {
  const updatedFaq = await faqService.updateFaq(req.body, req?.params?.id);
  sendResponse(
    res,
    true,
    returnMessage("admin", "faqUpdated"),
    updatedFaq,
    statusCode.success
  );
});

// Get FQA

exports.getFaq = catchAsyncError(async (req, res, next) => {
  const getFaq = await faqService.getFaq(req?.params?.id);
  sendResponse(
    res,
    true,
    returnMessage("admin", "getFaq"),
    getFaq,
    statusCode.success
  );
});
