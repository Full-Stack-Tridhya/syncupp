const catchAsyncError = require("../helpers/catchAsyncError");
const ClientService = require("../services/clientService");
const clientService = new ClientService();
const { sendResponse } = require("../utils/sendResponse");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const TeamMemberService = require("../services/teamMemberService");
const teamMemberService = new TeamMemberService();

exports.createClient = catchAsyncError(async (req, res, next) => {
  const client = await clientService.createClient(req.body, req.user);
  sendResponse(res, true, client?.message, client, statusCode.success);
});

exports.clients = catchAsyncError(async (req, res, next) => {
  const clients = await clientService.clientList(req.body, req.user);
  sendResponse(
    res,
    true,
    returnMessage("client", "clientsFetched"),
    clients,
    statusCode.success
  );
});

exports.getAgencies = catchAsyncError(async (req, res, next) => {
  const agencies = await clientService.getAgencies(req.user);
  sendResponse(
    res,
    true,
    returnMessage("client", "agenciesFetched"),
    agencies,
    statusCode.success
  );
});

exports.addClientTeam = catchAsyncError(async (req, res, next) => {
  await teamMemberService.addClientTeam(req.body, req.user);
  sendResponse(
    res,
    true,
    returnMessage("teamMember", "teamMemberCreatedByClient"),
    {},
    statusCode.success
  );
});

exports.deleteTeamMember = catchAsyncError(async (req, res, next) => {
  await teamMemberService.deleteMemberByClient(req.body, req.user);
  sendResponse(
    res,
    true,
    returnMessage("teamMember", "deleted"),
    {},
    statusCode.success
  );
});
