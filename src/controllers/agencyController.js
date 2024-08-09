const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const AgencyService = require("../services/agencyService");
const ClientService = require("../services/clientService");
const { sendResponse } = require("../utils/sendResponse");
const Authentication = require("../models/authenticationSchema");
const { throwError } = require("../helpers/errorUtil");
const AffiliateService = require("../services/affiliateService");
const affiliateService = new AffiliateService();
const agencyService = new AgencyService();
const clientService = new ClientService();

// Agency get Profile
exports.getAgencyProfile = catchAsyncError(async (req, res, next) => {
  const agency = await agencyService.getAgencyProfile(req.user);
  sendResponse(
    res,
    true,
    returnMessage("agency", "agencyGet"),
    agency,
    statusCode.success
  );
});

// Agency update profile
exports.updateAgencyProfile = catchAsyncError(async (req, res, next) => {
  const user_id = req?.user?._id;
  const reference_id = req?.user?.reference_id;
  await agencyService.updateAgencyProfile(req.body, user_id, reference_id);

  sendResponse(
    res,
    true,
    returnMessage("agency", "agencyUpdate"),
    null,
    statusCode.success
  );
});

exports.getAllAgency = catchAsyncError(async (req, res, next) => {
  const agencies = await agencyService.allAgencies(req.body);
  sendResponse(res, true, null, agencies, statusCode.success);
});

exports.updateAgency = catchAsyncError(async (req, res, next) => {
  await agencyService.updateAgencyStatus(req.body);
  let message = returnMessage("agency", "agencyUpdated");
  if (req.body.delete)
    message = returnMessage("agency", "agencyDeletedMessage");

  sendResponse(res, true, message, {}, statusCode.success);
});

// Affiliate Dashboard Data
exports.getAffiliateData = catchAsyncError(async (req, res, next) => {
  const dashboardData = await affiliateService.getDashboardData(req?.user);
  sendResponse(
    res,
    true,
    returnMessage("affiliate", "affiliateDataFetched"),
    dashboardData,
    statusCode.success
  );
});
