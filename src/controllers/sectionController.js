const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const SectionService = require("../services/sectionService");
const { sendResponse } = require("../utils/sendResponse");
const sectionService = new SectionService();

// Add   Section

exports.addSection = catchAsyncError(async (req, res, next) => {
  await sectionService.addSection(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("section", "created"),
    null,
    statusCode.success
  );
});
// Update   Section

exports.updateSection = catchAsyncError(async (req, res, next) => {
  await sectionService.updateSection(req?.body, req?.params, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("section", "updated"),
    null,
    statusCode.success
  );
});

// Get All Section

exports.getAllSections = catchAsyncError(async (req, res, next) => {
  const sections = await sectionService.getAllSections(req?.params);
  sendResponse(
    res,
    true,
    returnMessage("section", "fetched"),
    sections,
    statusCode.success
  );
});

// Get Section

exports.getSection = catchAsyncError(async (req, res, next) => {
  const section = await sectionService.getSection(req?.params);
  sendResponse(
    res,
    true,
    returnMessage("section", "fetched"),
    section,
    statusCode.success
  );
});

// Delete Section

exports.deleteSection = catchAsyncError(async (req, res, next) => {
  await sectionService.deleteSection(req?.params, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("section", "deleted"),
    null,
    statusCode.success
  );
});

// Section Sort Order change

exports.updateSectionOrder = catchAsyncError(async (req, res, next) => {
  await sectionService.updateSectionOrder(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("section", "orderUpdated"),
    null,
    statusCode.success
  );
});
