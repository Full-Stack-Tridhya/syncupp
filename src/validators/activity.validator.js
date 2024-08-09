const { body } = require("express-validator");
const validationMessage = require("../messages/valiation.json");

exports.createMeetMeetingValidator = [
  body("token")
    .not()
    .isEmpty()
    .withMessage(validationMessage.activity.tokenRequired),
  body("meeting_date")
    .not()
    .isEmpty()
    .withMessage(validationMessage.activity.dateRequired),
  body("meeting_start_time")
    .not()
    .isEmpty()
    .withMessage(validationMessage.activity.timeRequired),
];
