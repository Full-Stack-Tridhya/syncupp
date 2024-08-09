const { body } = require("express-validator");
const validationMessage = require("../messages/valiation.json");

exports.addMemberValidator = [
  body("first_name")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.nameRequired),
  body("last_name")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.nameRequired),
  body("contact_number").trim(),
  body("email")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.emailRequired)
    .trim(),
];

exports.verifyValidator = [
  body("first_name")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.firstNameRequired),
  body("last_name")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.lastNameRequired),

  body("email")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.emailRequired)
    .matches(
      /^([a-zA-Z0-9]+)([\-\_\.]*)([a-zA-Z0-9]*)([@])([a-zA-Z0-9]{2,})([\.][a-zA-Z]{2,3})$/
    )
    .withMessage(validationMessage.general.invalidEmail)
    .trim(),
  body("password")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.passwordRequired)
    .trim()
    .isLength({ min: 6 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$.!%*#?&])[A-Za-z\d@$.!%*#?&]{6,}$/)
    .withMessage(validationMessage.general.invalidPassword),
];
exports.loginTeamMemberValidator = [
  body("email")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.emailRequired)
    .matches(
      /^([a-zA-Z0-9]+)([\-\_\.]*)([a-zA-Z0-9]*)([@])([a-zA-Z0-9]{2,})([\.][a-zA-Z]{2,3})$/
    )
    .withMessage(validationMessage.general.invalidEmail)
    .trim(),
  body("password")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.passwordRequired)
    .trim()
    .isLength({ min: 6 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$.!%*#?&])[A-Za-z\d@$.!%*#?&]{6,}$/)
    .withMessage(validationMessage.general.invalidPassword),
];
