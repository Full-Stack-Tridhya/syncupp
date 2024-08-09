const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const TaskService = require("../services/taskService");
const { sendResponse } = require("../utils/sendResponse");
const taskService = new TaskService();

exports.addTask = catchAsyncError(async (req, res, next) => {
  const createTask = await taskService.createTask(
    req?.body,
    req?.user,
    req?.files
  );
  sendResponse(
    res,
    true,
    returnMessage("activity", "createTask"),
    createTask,
    statusCode.success
  );
});

exports.taskList = catchAsyncError(async (req, res, next) => {
  let taskList = await taskService.taskList(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("activity", "taskList"),
    taskList,
    statusCode.success
  );
});

exports.fetchTask = catchAsyncError(async (req, res, next) => {
  const fetchTask = await taskService.getTaskById(req?.params?.id, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("activity", "fetchTask"),
    fetchTask,
    statusCode.success
  );
});
exports.updateTask = catchAsyncError(async (req, res, next) => {
  const updateTask = await taskService.updateTask(
    req?.body,
    req?.params?.id,
    req?.files,
    req?.user
  );
  sendResponse(
    res,
    true,
    returnMessage("activity", "updateTask"),
    updateTask,
    statusCode.success
  );
});

exports.deleteTask = catchAsyncError(async (req, res, next) => {
  const deleteTask = await taskService.deleteTask(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("activity", "deleteTask"),
    deleteTask,
    statusCode.success
  );
});

exports.updateTaskStatus = catchAsyncError(async (req, res, next) => {
  await taskService.updateTaskStatus(req?.body, req?.params?.id, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("activity", "updateStatus"),
    null,
    statusCode.success
  );
});

exports.addTaskComment = catchAsyncError(async (req, res, next) => {
  let addTaskComment = await taskService.addTaskComment(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("activity", "commentAdded"),
    addTaskComment,
    statusCode.success
  );
});
exports.listTaskComment = catchAsyncError(async (req, res, next) => {
  let listTaskComment = await taskService.listTaskComment(
    req?.params,
    req?.user
  );
  sendResponse(
    res,
    true,
    returnMessage("activity", "commentFetched"),
    listTaskComment,
    statusCode.success
  );
});

exports.leaveTask = catchAsyncError(async (req, res, next) => {
  await taskService.leaveTask(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("activity", "taskLeave"),
    null,
    statusCode.success
  );
});
