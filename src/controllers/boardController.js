const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const BoardService = require("../services/boardService");
const { sendResponse } = require("../utils/sendResponse");
const boardService = new BoardService();

// Add Board

exports.addBoard = catchAsyncError(async (req, res, next) => {
  await boardService.addBoard(req?.body, req?.user, req?.file);
  sendResponse(
    res,
    true,
    returnMessage("board", "created"),
    null,
    statusCode.success
  );
});

// Get Board

exports.getBoard = catchAsyncError(async (req, res, next) => {
  const get_board = await boardService.getBoard(req?.params?.id);
  sendResponse(
    res,
    true,
    returnMessage("board", "boardFetched"),
    get_board,
    statusCode.success
  );
});

// Update Board

exports.updateBoard = catchAsyncError(async (req, res, next) => {
  await boardService.updateBoard(
    req?.body,
    req?.params?.id,
    req?.user,
    req?.file
  );
  sendResponse(
    res,
    true,
    returnMessage(
      "board",
      `${
        req?.body.only_member_update === "false"
          ? "updated"
          : "boardMemberUpdated"
      }`
    ),
    null,
    statusCode.success
  );
});

// List Board

exports.listBoards = catchAsyncError(async (req, res, next) => {
  const list_boards = await boardService.listBoards(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("board", "listFetched"),
    list_boards,
    statusCode.success
  );
});

// Pin Board

exports.changePinStatus = catchAsyncError(async (req, res, next) => {
  await boardService.changePinStatus(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage(
      "board",
      req?.body?.is_pinned ? "boardPinned" : "boardUnPinned"
    ),
    null,
    statusCode.success
  );
});

// Member List

exports.memberList = catchAsyncError(async (req, res, next) => {
  const member_list = await boardService.memberList(req?.params?.id, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("board", "membersFetched"),
    member_list,
    statusCode.success
  );
});

// User List

exports.allUserList = catchAsyncError(async (req, res, next) => {
  const all_user_list = await boardService.allUserList(req?.user);
  sendResponse(
    res,
    true,
    returnMessage("board", "membersFetched"),
    all_user_list,
    statusCode.success
  );
});

// Fetch Images Of Board

exports.fetchBoardImage = catchAsyncError(async (req, res, next) => {
  const board_images = await boardService.fetchBoardImages(req?.user);
  sendResponse(
    res,
    true,
    returnMessage("board", "boardImageFetched"),
    board_images,
    statusCode.success
  );
});

// Add Remove Member

exports.addRemoveMember = catchAsyncError(async (req, res, next) => {
  await boardService.addRemoveMember(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("board", "boardMemberUpdated"),
    null,
    statusCode.success
  );
});

// Delete Board
exports.deleteBoard = catchAsyncError(async (req, res, next) => {
  const data = await boardService.deleteBoard(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage(
      "board",
      data?.force_fully_remove ? "taskAvailable" : "boardStatusDeleted"
    ),
    data,
    statusCode.success
  );
});

// Update Board Status

exports.updateBoardStatus = catchAsyncError(async (req, res, next) => {
  await boardService.updateBoardStatus(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("board", "boardStatusUpdated"),
    null,
    statusCode.success
  );
});
