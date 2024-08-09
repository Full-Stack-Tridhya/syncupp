const catchAsyncError = require("../helpers/catchAsyncError");
const statusCode = require("../messages/statusCodes.json");
const { sendResponse } = require("../utils/sendResponse");
const WorkspaceService = require("../services/workspaceService");
const { returnMessage } = require("../utils/utils");
const workspaceService = new WorkspaceService();

exports.workspaces = catchAsyncError(async (req, res, next) => {
  const workspaces = await workspaceService.workspaces(req.user);
  sendResponse(
    res,
    true,
    returnMessage("workspace", "workspacesFetched"),
    workspaces,
    statusCode.success
  );
});

exports.workspaceCheck = catchAsyncError(async (req, res, next) => {
  await workspaceService.workspaceCheck(req.body, req.user);
  sendResponse(res, true, undefined, {}, statusCode.success);
});
