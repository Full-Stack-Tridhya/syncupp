const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const AgreementService = require("../services/agreementService");
const { sendResponse } = require("../utils/sendResponse");
const agreementService = new AgreementService();
const AuthService = require("../services/authService");
const authService = new AuthService();

// -------------------   Agency API   ------------------------

// Add Agreement

exports.addAgreement = catchAsyncError(async (req, res, next) => {
  const addedAgreement = await agreementService.addAgreement(
    req?.body,
    req?.user
  );
  sendResponse(
    res,
    true,
    returnMessage("agreement", "agreementAdded"),
    addedAgreement,
    statusCode.success
  );
});

// get All Agreement

exports.getAllAgreement = catchAsyncError(async (req, res, next) => {
  let agreements;
  const user_role_data = await authService.getRoleSubRoleInWorkspace(req?.user);
  req.user["role"] = user_role_data?.user_role;
  req.user["sub_role"] = user_role_data?.sub_role;

  if (
    user_role_data?.user_role === "agency" ||
    (user_role_data?.user_role === "team_agency" &&
      user_role_data?.sub_role === "admin")
  ) {
    agreements = await agreementService.getAllAgreement(req?.body, req?.user);
  } else if (user_role_data?.user_role === "client") {
    agreements = await agreementService.getAllClientAgreement(
      req?.body,
      req?.user
    );
  }

  sendResponse(
    res,
    true,
    returnMessage("agreement", "getAllAgreement"),
    agreements,
    statusCode.success
  );
});

// delete Agreement

exports.deleteAgreement = catchAsyncError(async (req, res, next) => {
  const user_role_data = await authService.getRoleSubRoleInWorkspace(req?.user);
  req.user["role"] = user_role_data?.user_role;
  req.user["sub_role"] = user_role_data?.sub_role;

  if (user_role_data?.user_role === "agency") {
    await agreementService.deleteAgreement(req?.body);
  }
  sendResponse(
    res,
    true,
    returnMessage("agreement", "deleteAgreement"),
    null,
    statusCode.success
  );
});

// Update Agreement

exports.updateAgreement = catchAsyncError(async (req, res, next) => {
  let updatedAgreement;
  const user_role_data = await authService.getRoleSubRoleInWorkspace(req?.user);
  req.user["role"] = user_role_data?.user_role;
  req.user["sub_role"] = user_role_data?.sub_role;

  if (user_role_data?.user_role === "agency") {
    updatedAgreement = await agreementService.updateAgreement(
      req?.body,
      req?.params?.id
    );
  }

  sendResponse(
    res,
    true,
    returnMessage("agreement", "agreementUpdated"),
    updatedAgreement,
    statusCode.success
  );
});

// Get Agreement

exports.getAgreement = catchAsyncError(async (req, res, next) => {
  let getAgreement;

  const user_role_data = await authService.getRoleSubRoleInWorkspace(req?.user);
  req.user["role"] = user_role_data?.user_role;
  req.user["sub_role"] = user_role_data?.sub_role;

  if (
    user_role_data?.user_role === "agency" ||
    user_role_data?.user_role === "client"
  ) {
    getAgreement = await agreementService.getAgreement(req?.params?.id);
  }

  sendResponse(
    res,
    true,
    returnMessage("agreement", "getAgreement"),
    getAgreement,
    statusCode.success
  );
});
// Send Agreement

exports.sendAgreement = catchAsyncError(async (req, res, next) => {
  const user_role_data = await authService.getRoleSubRoleInWorkspace(req?.user);
  req.user["role"] = user_role_data?.user_role;
  req.user["sub_role"] = user_role_data?.sub_role;

  if (user_role_data?.user_role === "agency") {
    await agreementService.sendAgreement(req?.body, req.user);
  }

  sendResponse(
    res,
    true,
    returnMessage("agreement", "agreementSent"),
    null,
    statusCode.success
  );
});

// Update Agreement status

exports.updateAgreementStatus = catchAsyncError(async (req, res, next) => {
  let updatedAgreement;
  const user_role_data = await authService.getRoleSubRoleInWorkspace(req?.user);
  req.user["role"] = user_role_data?.user_role;
  req.user["sub_role"] = user_role_data?.sub_role;

  if (
    user_role_data?.user_role === "client" ||
    user_role_data?.user_role === "agency"
  ) {
    updatedAgreement = await agreementService.updateAgreementStatus(
      req?.body,
      req?.params?.id,
      req?.user
    );
  }

  sendResponse(
    res,
    true,
    returnMessage("agreement", "agreementStatusUpdated"),
    updatedAgreement,
    statusCode.success
  );
});

exports.downloadPdf = catchAsyncError(async (req, res, next) => {
  let downloadPdf;
  const user_role_data = await authService.getRoleSubRoleInWorkspace(req?.user);
  req.user["role"] = user_role_data?.user_role;
  req.user["sub_role"] = user_role_data?.sub_role;

  if (user_role_data?.user_role === "agency") {
    downloadPdf = await agreementService.downloadPdf(req?.params?.id, res);
  }
  sendResponse(
    res,
    true,
    returnMessage("agreement", "downloadPDF"),
    downloadPdf,
    statusCode.success
  );
});

exports.getClients = catchAsyncError(async (req, res, next) => {
  const getClients = await agreementService.getClients(req?.user);
  sendResponse(res, true, undefined, getClients, statusCode.success);
});
