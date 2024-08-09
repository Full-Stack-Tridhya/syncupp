const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const EventService = require("../services/eventService");
const { sendResponse } = require("../utils/sendResponse");
const eventService = new EventService();

exports.createEvent = catchAsyncError(async (req, res, next) => {
  const createEvent = await eventService.createEvent(req?.body, req?.user);

  sendResponse(
    res,
    true,
    createEvent?.event_exist
      ? createEvent.message
      : returnMessage("event", "createEvent"), // Use appropriate message based on event_exist
    createEvent,
    statusCode.success // Check if event_exist is true
  );
});

exports.fetchEvent = catchAsyncError(async (req, res, next) => {
  const fetchEvent = await eventService.fetchEvent(req?.params?.id);
  sendResponse(
    res,
    true,
    returnMessage("event", "fetchEvent"),
    fetchEvent,
    statusCode.success
  );
});

exports.eventList = catchAsyncError(async (req, res, next) => {
  const eventList = await eventService.eventList(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("event", "eventList"),
    eventList,
    statusCode.success
  );
});

exports.updateEvent = catchAsyncError(async (req, res, next) => {
  const eventUpdate = await eventService.updateEvent(
    req?.params?.id,
    req?.body,
    req?.user
  );

  sendResponse(
    res,
    true,
    eventUpdate?.event_exist
      ? eventUpdate.message
      : returnMessage("event", "eventUpdate"), // Use appropriate message based on event_exist
    eventUpdate,
    statusCode.success // Check if event_exist is true
  );
});

exports.deleteEvent = catchAsyncError(async (req, res, next) => {
  const updateStatus = await eventService.deleteEvent(req.params.id, req.user);
  sendResponse(
    res,
    true,
    returnMessage("event", "deleteEvent"),
    updateStatus,
    statusCode.success
  );
});
