const { body } = require("express-validator");
const validationMessage = require("../messages/valiation.json");
exports.addClientReviewValidator = [
  body("customer_name")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.customerNameRequired),
  body("company_name")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.companyNameRequired),
  body("review")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.clientReviewIsviewRequired)
    .isLength({ max: 1000 }) // specify the maximum length for the description
    .withMessage(validationMessage.general.clientReviewLength),
];
exports.deleteClientReviewValidator = [
  body("clientReviewIdsToDelete")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.clientReviewIdsReq),
];
exports.updateClientReviewValidator = [
  body("customer_name")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.customerNameRequired),
  body("company_name")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.companyNameRequired),
  body("review")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.clientReviewIsviewRequired)
    .isLength({ max: 1000 }) // specify the maximum length for the description
    .withMessage(validationMessage.general.clientReviewLength),
];
