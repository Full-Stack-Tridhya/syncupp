const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const { sendResponse } = require("../utils/sendResponse");
const DashboardService = require("../services/dashboardService");
const dashboardService = new DashboardService();
const AuthService = require("../services/authService");
const authService = new AuthService();

// Get Dashboard information

exports.dashboardData = catchAsyncError(async (req, res, next) => {
  let dashboardData;

  const user_role_data = await authService.getRoleSubRoleInWorkspace(req?.user);
  req.user["role"] = user_role_data?.user_role;
  req.user["sub_role"] = user_role_data?.sub_role;
  dashboardData = await dashboardService.dashboardData(req?.user);

  sendResponse(
    res,
    true,
    returnMessage("agency", "dashboardDataFetched"),
    dashboardData,
    statusCode.success
  );
});

// Get Todays Call Meeting

exports.callMeetingList = catchAsyncError(async (req, res, next) => {
  const user_role_data = await authService.getRoleSubRoleInWorkspace(req?.user);
  req.user["role"] = user_role_data?.user_role;
  req.user["sub_role"] = user_role_data?.sub_role;

  const callMeetingList = await dashboardService.callMeetingList(
    req?.query,
    req?.user
  );

  sendResponse(
    res,
    true,
    returnMessage("activity", "meetingFetched"),
    callMeetingList,
    statusCode.success
  );
});

// Get Completed task

exports.listTask = catchAsyncError(async (req, res, next) => {
  const user_role_data = await authService.getRoleSubRoleInWorkspace(req?.user);
  req.user["role"] = user_role_data?.user_role;
  req.user["sub_role"] = user_role_data?.sub_role;
  const listTask = await dashboardService.taskTask(req?.query, req?.user);

  sendResponse(
    res,
    true,
    returnMessage("agency", "taskFetched"),
    listTask,
    statusCode.success
  );
});
