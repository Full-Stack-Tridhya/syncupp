const { body } = require("express-validator");
const validationMessage = require("../messages/valiation.json");
exports.resetPasswordValidator = [
  body("token")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.tokenRequired),
  body("email")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.emailRequired)
    .trim(),
  body("newPassword")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.passwordRequired)
    .trim(),
];

exports.loginAdminValidator = [
  body("email")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.emailRequired)
    .trim(),
  body("password")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.passwordRequired)
    .trim(),
];

exports.updatePasswordValidator = [
  body("oldPassword")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.passwordRequired)
    .trim(),
  body("newPassword")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.passwordRequired)
    .trim(),
];
