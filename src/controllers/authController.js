const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const AuthService = require("../services/authService");
const AgencyService = require("../services/agencyService");
const authService = new AuthService();
const agencyService = new AgencyService();
const { sendResponse } = require("../utils/sendResponse");
const { throwError } = require("../helpers/errorUtil");

// this function is used only for the Agency Sign-up

exports.userSignUp = catchAsyncError(async (req, res, next) => {
  const user = await authService.userSignUp(req.body);
  let message = returnMessage("user", "userRegistered");
  sendResponse(res, true, message, user, statusCode.success);
});

exports.signupComplete = catchAsyncError(async (req, res, next) => {
  const user = await authService.signupComplete(req.body);
  let message = returnMessage("user", "userRegistered");
  sendResponse(res, true, message, user, statusCode.success);
});

exports.checkContactunique = catchAsyncError(async (req, res, next) => {
  const contact = await authService.checkContactunique(req.body);
  sendResponse(res, true, undefined, contact, statusCode.success);
});

exports.getEmailDetails = catchAsyncError(async (req, res, next) => {
  const user = await authService.getEmailDetails({
    ...req.body,
    token: req?.headers?.authorization || req?.headers?.token || undefined,
  });
  sendResponse(res, true, undefined, user, statusCode.success);
});

exports.changeWorkspace = catchAsyncError(async (req, res, next) => {
  const workspace = await authService.changeWorkspace(
    req.headers.authorization || req.headers.token,
    req.body,
    req.user
  );
  sendResponse(res, true, undefined, workspace, statusCode.success);
});

exports.agencyGoogleSignUp = catchAsyncError(async (req, res, next) => {
  const agencyGoogleSignUp = await authService.googleSign(req.body);
  return sendResponse(
    res,
    true,
    returnMessage("auth", "loggedIn"),
    agencyGoogleSignUp,
    statusCode.success
  );
});

exports.agencyFacebookSignUp = catchAsyncError(async (req, res, next) => {
  const agencyFacebookSignUp = await authService.facebookSignIn(req.body);
  return sendResponse(
    res,
    true,
    returnMessage("auth", "loggedIn"),
    agencyFacebookSignUp,
    statusCode.success
  );
});

exports.login = catchAsyncError(async (req, res, next) => {
  const loggedIn = await authService.login(req.body);
  let message = returnMessage("auth", "loggedIn");
  if (loggedIn?.user?.status === "signup_incomplete")
    message = returnMessage("user", "signupIncomplete");
  return sendResponse(res, true, message, loggedIn, statusCode.success);
});

exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  await authService.forgotPassword(req.body);
  return sendResponse(
    res,
    true,
    returnMessage("auth", "resetPasswordMailSent"),
    {},
    statusCode.success
  );
});

exports.resetPassword = catchAsyncError(async (req, res, next) => {
  await authService.resetPassword(req.body);
  return sendResponse(
    res,
    true,
    returnMessage("auth", "passwordReset"),
    {},
    statusCode.success
  );
});

exports.changePassword = catchAsyncError(async (req, res, next) => {
  await authService.changePassword(req.body, req.user._id);
  return sendResponse(
    res,
    true,
    returnMessage("auth", "passwordChanged"),
    {},
    statusCode.success
  );
});

exports.countriesList = catchAsyncError(async (req, res, next) => {
  const countries = await authService.countryList(req.body);
  return sendResponse(res, true, undefined, countries, statusCode.success);
});

exports.statesList = catchAsyncError(async (req, res, next) => {
  if (!req.params.countryId)
    return throwError(returnMessage("auth", "countryIdRequired"));
  const states = await authService.statesList(req.params.countryId, req.body);
  return sendResponse(res, true, undefined, states, statusCode.success);
});

exports.citiesList = catchAsyncError(async (req, res, next) => {
  if (!req.params.stateId)
    return throwError(returnMessage("auth", "stateIdRequired"));
  const cities = await authService.citiesList(req.params.stateId, req.body);
  return sendResponse(res, true, undefined, cities, statusCode.success);
});

exports.getProfile = catchAsyncError(async (req, res, next) => {
  const user_profile = await authService.getProfile(req.user);
  sendResponse(
    res,
    true,
    returnMessage("auth", "profileFetched"),
    user_profile,
    statusCode.success
  );
});

exports.updateProfile = catchAsyncError(async (req, res, next) => {
  await agencyService.updateProfile(req.body, req.user, req?.file);
  sendResponse(
    res,
    true,
    returnMessage("auth", "profileUpdated"),
    {},
    statusCode.success
  );
});

exports.passwordSetRequired = catchAsyncError(async (req, res, next) => {
  const password_set_required = await authService.passwordSetRequired(req.body);
  sendResponse(
    res,
    true,
    returnMessage("auth", "profileUpdated"),
    password_set_required,
    statusCode.success
  );
});
exports.refferalEmail = catchAsyncError(async (req, res, next) => {
  const refferal_email = await authService.sendReferaal(req.user, req.body);
  sendResponse(
    res,
    true,
    returnMessage("auth", "sendRefferalEmail"),
    refferal_email,
    statusCode.success
  );
});

exports.checkSubscriptionHalt = catchAsyncError(async (req, res, next) => {
  const checkSubscriptionHalt = await authService.checkSubscriptionHalt(
    req.user
  );
  sendResponse(res, true, undefined, checkSubscriptionHalt, statusCode.success);
});

exports.planSelectPopUp = catchAsyncError(async (req, res, next) => {
  await authService.planSelectionPopUpStatus(req.user);
  sendResponse(res, true, undefined, {}, statusCode.success);
});
