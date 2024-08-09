const { body } = require("express-validator");
const validationMessage = require("../messages/valiation.json");

exports.validateCreateInquiry = [
  body("first_name")
    .notEmpty()
    .withMessage(validationMessage.inquiry.firstRequired),
  body("last_name")
    .notEmpty()
    .withMessage(validationMessage.inquiry.lastRequired),
  body("thoughts")
    .notEmpty()
    .withMessage(validationMessage.inquiry.thoughtRequired)
    .isLength({ max: 400 }) // specify the maximum length for the agreement_content
    .withMessage(validationMessage.inquiry.descLength),

  body("contact_number")
    .notEmpty()
    .withMessage(validationMessage.inquiry.contactNumberRequired),
  body("email").isEmail().withMessage(validationMessage.inquiry.emailInvalid),
];
