const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const ActivityService = require("../services/activityService");
const { sendResponse } = require("../utils/sendResponse");
const activityService = new ActivityService();

// Create Call meeting
exports.createCallActivity = catchAsyncError(async (req, res, next) => {
  await activityService.createCallMeeting(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("activity", "activityCreated"),
    {},
    200
  );
});

// Get Activity
exports.getActivity = catchAsyncError(async (req, res, next) => {
  const activity = await activityService.getActivityById(
    req?.params?.activityId,
    req?.user
  );
  sendResponse(
    res,
    true,
    returnMessage("activity", "activityFetched"),
    activity,
    200
  );
});

// Status List
exports.statusList = catchAsyncError(async (req, res, next) => {
  const statusList = await activityService.activityStatus();
  sendResponse(
    res,
    true,
    returnMessage("activity", "statusList"),
    statusList,
    statusCode.success
  );
});

// Delete Activity
exports.deleteActivity = catchAsyncError(async (req, res, next) => {
  const deleteActivity = await activityService.deleteActivity(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("activity", "deleteActivity"),
    deleteActivity,
    statusCode.success
  );
});

// Update Status
exports.updateStatus = catchAsyncError(async (req, res, next) => {
  const updateStatus = await activityService.statusUpdate(
    req?.body,
    req?.params?.id,
    req?.user
  );
  sendResponse(
    res,
    true,
    returnMessage("activity", "activityStatusUpdated"),
    updateStatus,
    statusCode.success
  );
});

// Update Call meeting
exports.updateCallActivity = catchAsyncError(async (req, res, next) => {
  await activityService.updateActivity(
    req?.params?.activityId,
    req?.body,
    req?.user
  );
  sendResponse(
    res,
    true,
    returnMessage("activity", "activityUpdated"),
    {},
    200
  );
});

// Get Activities
exports.getActivities = catchAsyncError(async (req, res, next) => {
  const activities = await activityService.getActivities(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("activity", "activityListFetched"),
    activities,
    200
  );
});

// Leader board
exports.leaderboard = catchAsyncError(async (req, res, next) => {
  const leaderboard = await activityService.leaderboard(req?.body, req?.user);
  sendResponse(res, true, undefined, leaderboard, 200);
});

// Assigned Activity
exports.assignedActivity = catchAsyncError(async (req, res, next) => {
  const assigned_activity = await activityService.checkAnyActivitiesAssingend(
    req?.body,
    req?.user
  );
  sendResponse(res, true, undefined, assigned_activity, 200);
});

// Completion History
exports.completionHistory = catchAsyncError(async (req, res, next) => {
  const completionHistory = await activityService.completionHistory(
    req?.body,
    req?.user
  );
  sendResponse(
    res,
    true,
    returnMessage("activity", "completionHistory"),
    completionHistory,
    statusCode.success
  );
});

// COmpetition Stats
exports.competitionStats = catchAsyncError(async (req, res, next) => {
  const competitionStats = await activityService.competitionStats(req?.user);
  sendResponse(res, true, undefined, competitionStats, statusCode.success);
});
