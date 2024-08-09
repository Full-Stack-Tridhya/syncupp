const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const TeamMemberService = require("../services/teamMemberService");
const { sendResponse } = require("../utils/sendResponse");
const teamMemberService = new TeamMemberService();

// Team Member add
exports.add = catchAsyncError(async (req, res, next) => {
  const member = await teamMemberService.addAgencyTeam(req.body, req.user);
  sendResponse(res, true, member?.message, {}, statusCode.success);
});

// Team Member Verification
exports.verify = catchAsyncError(async (req, res, next) => {
  const verified_user = await teamMemberService.verify(req.body);
  sendResponse(
    res,
    true,
    returnMessage("workspace", "verified"),
    verified_user,
    statusCode.success
  );
});

// Team Member Login
exports.login = catchAsyncError(async (req, res, next) => {
  const teamMember = await teamMemberService.login(req.body);
  sendResponse(
    res,
    true,
    returnMessage("auth", "loggedIn"),
    teamMember,
    statusCode.success
  );
});

//  Get one Team Member
exports.getMember = catchAsyncError(async (req, res, next) => {
  const teamMember = await teamMemberService.getMember(
    req?.params?.id,
    req.user
  );
  sendResponse(
    res,
    true,
    returnMessage("teamMember", "memberGet"),
    teamMember,
    statusCode.success
  );
});

//  Delete Team Member

exports.deleteMember = catchAsyncError(async (req, res, next) => {
  const delete_member = await teamMemberService.deleteMember(
    req?.body,
    req.user
  );
  sendResponse(
    res,
    true,
    !delete_member?.force_fully_remove
      ? returnMessage("teamMember", "deleted")
      : undefined,
    delete_member,
    statusCode.success
  );
});

//  Get All Team Member
exports.getAll = catchAsyncError(async (req, res, next) => {
  const teamMemberList = await teamMemberService.getAllTeam(req.body, req.user);
  sendResponse(
    res,
    true,
    returnMessage("teamMember", "TeamMemberFetched"),
    teamMemberList,
    statusCode.success
  );
});

//  Edit Team Member

exports.editMember = catchAsyncError(async (req, res, next) => {
  const teamMember = await teamMemberService.editMember(
    req.body,
    req.params.id,
    req.user
  );
  sendResponse(
    res,
    true,
    returnMessage("teamMember", "updated"),
    teamMember,
    statusCode.success
  );
});

// reject client team member
exports.rejectTeamMember = catchAsyncError(async (req, res, next) => {
  await teamMemberService.approveOrReject(req.body, req.user);
  let message = returnMessage("teamMember", "teamMemberRejected");

  if (req.body.status === "accept")
    message = returnMessage("teamMember", "teamMemberCreated");

  sendResponse(res, true, message, {}, statusCode.success);
});
