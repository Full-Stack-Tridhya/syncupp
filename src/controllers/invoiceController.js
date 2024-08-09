const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const InvoiceService = require("../services/invoiceService");
const { sendResponse } = require("../utils/sendResponse");
const invoiceService = new InvoiceService();
const AuthService = require("../services/authService");
const authService = new AuthService();

// Add Clients ------   AGENCY API

exports.getClients = catchAsyncError(async (req, res, next) => {
  let getClients = await invoiceService?.getClients(req?.user);
  sendResponse(
    res,
    true,
    returnMessage("invoice", "clientFetched"),
    getClients,
    statusCode.success
  );
});

// Add Invoice ------   AGENCY API

exports.addInvoice = catchAsyncError(async (req, res, next) => {
  const addedInvoice = await invoiceService?.addInvoice(
    req?.body,
    req?.user,
    req?.file
  );
  sendResponse(
    res,
    true,
    returnMessage("invoice", "invoiceCreatedSuccess"),
    addedInvoice,
    statusCode.success
  );
});

// Update Invoice  ------   Agency API

exports.updateInvoice = catchAsyncError(async (req, res, next) => {
  await invoiceService.updateInvoice(
    req?.body,
    req?.params?.id,
    req?.user,
    req?.file
  );
  sendResponse(
    res,
    true,
    returnMessage("invoice", "invoiceUpdated"),
    null,
    statusCode.success
  );
});

// get All Invoice ------   AGENCY API AND CLIENT API --------------------------------

exports.getAllInvoice = catchAsyncError(async (req, res, next) => {
  let invoicesList;
  const user_role_data = await authService.getRoleSubRoleInWorkspace(req?.user);
  if (
    user_role_data?.user_role === "agency" ||
    (user_role_data?.user_role === "team_agency" &&
      user_role_data?.sub_role === "admin")
  ) {
    invoicesList = await invoiceService?.getAllInvoice(req?.body, req?.user);
  } else if (user_role_data?.user_role === "client") {
    invoicesList = await invoiceService.getClientInvoice(req?.body, req?.user);
  }
  sendResponse(
    res,
    true,
    returnMessage("invoice", "getAllInvoices"),
    invoicesList,
    statusCode.success
  );
});

// Get Invoice     ------   AGENCY API / Client API

exports.getInvoice = catchAsyncError(async (req, res, next) => {
  const getInvoice = await invoiceService.getInvoice(req?.params?.id);

  sendResponse(
    res,
    true,
    returnMessage("invoice", "getAllInvoices"),
    getInvoice,
    statusCode.success
  );
});

// delete Invoice ------   AGENCY API

exports.deleteInvoice = catchAsyncError(async (req, res, next) => {
  const user_role_data = await authService.getRoleSubRoleInWorkspace(req?.user);
  if (user_role_data?.user_role === "agency") {
    await invoiceService.deleteInvoice(req?.body);
  }
  sendResponse(
    res,
    true,
    returnMessage("invoice", "invoiceDeleted"),
    null,
    statusCode.success
  );
});

// Update Status Invoice Status ------   Agency API

exports.updateStatusInvoice = catchAsyncError(async (req, res, next) => {
  const user_role_data = await authService.getRoleSubRoleInWorkspace(req?.user);
  if (user_role_data?.user_role === "agency") {
    await invoiceService.updateStatusInvoice(
      req?.body,
      req?.params?.id,
      req?.user
    );
  }
  sendResponse(
    res,
    true,
    returnMessage("invoice", "invoiceStatusUpdated"),
    null,
    statusCode.success
  );
});

// Send Invoice By mail------   Agency API

exports.sendInvoice = catchAsyncError(async (req, res, next) => {
  await invoiceService.sendInvoice(req?.body, "", req?.user);
  sendResponse(
    res,
    true,
    returnMessage("invoice", "invoiceSent"),
    null,
    statusCode.success
  );
});

// Download PDF

exports.downloadPdf = catchAsyncError(async (req, res, next) => {
  const downloadPdf = await invoiceService.downloadPdf(
    req?.params,
    res,
    req.user
  );
  sendResponse(
    res,
    true,
    returnMessage("invoice", "downloadPDF"),
    downloadPdf,
    statusCode.success
  );
});

// Currency Listing

exports.currencyList = catchAsyncError(async (req, res, next) => {
  const list = await invoiceService.currencyList(req?.user);
  sendResponse(
    res,
    true,
    returnMessage("invoice", "currencyListFetched"),
    list,
    statusCode.success
  );
});

// Currency Add

exports.addCurrency = catchAsyncError(async (req, res, next) => {
  const list = await invoiceService.addCurrency(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("invoice", "currencyAdded"),
    list,
    statusCode.success
  );
});

// Currency Add

exports.uploadLogo = catchAsyncError(async (req, res, next) => {
  await invoiceService.uploadLogo(req?.user, req?.file);
  sendResponse(
    res,
    true,
    returnMessage("invoice", "logoUploaded"),
    null,
    statusCode.success
  );
});
// Get Setting

exports.getSetting = catchAsyncError(async (req, res, next) => {
  const getSetting = await invoiceService.getSetting(req?.user);
  sendResponse(
    res,
    true,
    returnMessage("invoice", "settingFetched"),
    getSetting,
    statusCode.success
  );
});
