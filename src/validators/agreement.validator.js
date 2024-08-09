const { body } = require("express-validator");
const validationMessage = require("../messages/valiation.json");

exports.addAgreementValidator = [
  body("title")
    .not()
    .isEmpty()
    .withMessage(validationMessage.agreement.titleRequired)
    .isLength({ max: 100 }) // specify the maximum length for the title
    .withMessage(validationMessage.general.titleLength),
  body("agreement_content")
    .not()
    .isEmpty()
    .withMessage(validationMessage.agreement.descRequired)
    .isLength({ max: 4000 }) // specify the maximum length for the agreement_content
    .withMessage(validationMessage.agreement.descLength),

  body("due_date")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.dateRequired),
];
exports.updateAgreementValidator = [
  body("title")
    .isLength({ max: 100 }) // specify the maximum length for the title
    .withMessage(validationMessage.general.titleLength),
  body("agreement_content")
    .isLength({ max: 4000 }) // specify the maximum length for the description
    .withMessage(validationMessage.general.descLength),
];
