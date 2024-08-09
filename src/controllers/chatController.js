const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const { sendResponse } = require("../utils/sendResponse");
const ChatService = require("../services/chatService");
const GroupChatService = require("../services/groupChatService");
const chatService = new ChatService();
const groupChatService = new GroupChatService();

exports.fetchUsersList = catchAsyncError(async (req, res, next) => {
  const users_list = await chatService.fetchUsersList(req.body, req.user);
  sendResponse(
    res,
    true,
    returnMessage("chat", "usersListFetched"),
    users_list,
    statusCode.success
  );
});

exports.chatHistory = catchAsyncError(async (req, res, next) => {
  const chat_history = await chatService.chatHistory(req.body, req.user);
  sendResponse(
    res,
    true,
    returnMessage("chat", "historyFetched"),
    chat_history,
    statusCode.success
  );
});

// this will use to fetch the users list for the group chat
exports.fetchUsers = catchAsyncError(async (req, res, next) => {
  const users = await groupChatService.usersList(req.body, req.user);
  sendResponse(res, true, undefined, users, 200);
});

exports.createGroup = catchAsyncError(async (req, res, next) => {
  await groupChatService.createGroupChat(req.body, req.file, req.user);
  sendResponse(res, true, returnMessage("chat", "groupCreated"), {}, 200);
});

exports.groups = catchAsyncError(async (req, res, next) => {
  const groups = await groupChatService.groupsList(req.user, req.body);
  sendResponse(res, true, undefined, groups, 200);
});

exports.groupChatHistory = catchAsyncError(async (req, res, next) => {
  const history = await groupChatService.chatHistory(req.body, req.user);
  sendResponse(res, true, undefined, history, 200);
});

exports.updateGroup = catchAsyncError(async (req, res, next) => {
  const updated_group = await groupChatService.updateGroup(
    req.body,
    req.file,
    req.user
  );
  sendResponse(res, true, undefined, updated_group, 200);
});

exports.getGroup = catchAsyncError(async (req, res, next) => {
  const group = await groupChatService.getGroup(req.params.groupId);
  sendResponse(res, true, undefined, group, 200);
});

exports.uploadImage = catchAsyncError(async (req, res, next) => {
  await chatService.uploadImage(req.body, req.file, req.user);
  sendResponse(res, true, undefined, {}, 200);
});

exports.uploadDocument = catchAsyncError(async (req, res, next) => {
  await chatService.uploadDocument(req.body, req.file, req.user);
  sendResponse(res, true, undefined, {}, 200);
});
exports.uploadAudio = catchAsyncError(async (req, res, next) => {
  await chatService.uploadAudio(req.body, req.file, req.user);
  sendResponse(res, true, undefined, {}, 200);
});

exports.getAllDocuments = catchAsyncError(async (req, res, next) => {
  const documents = await chatService.getAllDocuments(req.body, req.user);
  sendResponse(res, true, undefined, documents, 200);
});
