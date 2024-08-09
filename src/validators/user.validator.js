const { body } = require("express-validator");
const constants = require("../messages/commonMessages");

exports.changePasswordValidator = [
  body("oldPassword")
    .not()
    .isEmpty()
    .withMessage("Old password is required.")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Old password must have atleast 6 letters."),
  body("newPassword")
    .not()
    .isEmpty()
    .withMessage("New password is required.")
    .trim()
    .isLength({ min: 6 })
    .withMessage("New password must have atleast 6 letters.")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$.!%*#?&])[A-Za-z\d@$.!%*#?&]{6,}$/)
    .withMessage(
      "Password should be combination of one uppercase, one lower case, one special character, one digit and minimum 6."
    ),
  body("confirmPassword")
    .not()
    .isEmpty()
    .withMessage("Confirm password is required.")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Confirm password must have atleast 6 letters."),
];

exports.resetPasswordValidator = [
  body("newPassword")
    .not()
    .isEmpty()
    .withMessage("New password is required.")
    .trim()
    .isLength({ min: 6 })
    .withMessage("New password must have atleast 6 letters.")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$.!%*#?&])[A-Za-z\d@$.!%*#?&]{6,}$/)
    .withMessage(
      "Password should be combination of one uppercase, one lower case, one special character, one digit and minimum 6."
    ),
  // body('confirmPassword')
  //   .not()
  //   .isEmpty()
  //   .withMessage('USER_VALIDATION.CONFIRM_PASSWORD_REQUIRED')
  //   .trim()
  //   .isLength({ min: 6 })
  //   .withMessage('USER_VALIDATION.CONFIRM_PASSWORD_SIZE'),
];

exports.forgotPasswordValidator = [
  body("email")
    .not()
    .isEmpty()
    .withMessage("USER_VALIDATION.EMAIL_REQUIRED")
    .isEmail()
    .withMessage("USER_VALIDATION.VALID_EMAIL")
    .trim(),
];

exports.loginValidator = [
  body("email")
    .not()
    .isEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please enter a valid email.")
    .trim(),
  body("password").not().isEmpty().withMessage("Password is required.").trim(),
];
