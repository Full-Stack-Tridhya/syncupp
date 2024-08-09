const { body } = require("express-validator");
const validationMessage = require("../messages/valiation.json");

exports.validateCreateBoard = [
  body("project_name")
    .notEmpty()
    .withMessage(validationMessage.board.projectNameRequired),
  // body("description")
  //   .notEmpty()
  //   .withMessage(validationMessage.board.descriptionRequired),
  body("members")
    .notEmpty()
    .withMessage(validationMessage.board.membersRequired),
];
