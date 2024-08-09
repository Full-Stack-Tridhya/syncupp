const catchAsyncError = require("../helpers/catchAsyncError");
const { sendResponse } = require("../utils/sendResponse");
const ReferralService = require("../services/referralService");
const { returnMessage } = require("../utils/utils");
const referralService = new ReferralService();

exports.checkRefferal = catchAsyncError(async (req, res, next) => {
  const checkRefferal = await referralService.checkReferralAvailable(req.user);
  sendResponse(
    res,
    true,
    returnMessage("referral", "checkRefferal"),
    checkRefferal,
    200
  );
});

exports.referralStats = catchAsyncError(async (req, res, next) => {
  const referralStats = await referralService.referralStatistics(req.user);

  sendResponse(
    res,
    true,
    returnMessage("referral", "referralStats"),
    referralStats,
    200
  );
});
