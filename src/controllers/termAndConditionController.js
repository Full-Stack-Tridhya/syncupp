const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const TermAndConditionService = require("../services/termAndConditionService");
const { sendResponse } = require("../utils/sendResponse");
const termAndConditionService = new TermAndConditionService();

// Add TermAndCondition

exports.addTermAndCondition = catchAsyncError(async (req, res, next) => {
  const addedTermAndCondition =
    await termAndConditionService.addTermAndCondition(req.body);
  sendResponse(
    res,
    true,
    returnMessage("cms", "TermAndConditionAdded"),
    addedTermAndCondition,
    statusCode.success
  );
});

exports.getTermAndCondition = catchAsyncError(async (req, res, next) => {
  const getTermAndCondition = await termAndConditionService.getTermAndCondition(
    req.body
  );
  sendResponse(
    res,
    true,
    returnMessage("cms", "getTermandCondition"),
    getTermAndCondition,
    statusCode.success
  );
});
exports.updateTermAndCondition = catchAsyncError(async (req, res, next) => {
  const updateTermAndCondition =
    await termAndConditionService.updateTermAndCondition(req.body);
  sendResponse(
    res,
    true,
    returnMessage("cms", "updateTermAndCondition"),
    updateTermAndCondition,
    statusCode.success
  );
});
