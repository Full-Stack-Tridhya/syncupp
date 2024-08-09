const { body } = require("express-validator");
const validationMessage = require("../messages/valiation.json");

exports.addFaqValidator = [
  body("title")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.titleRequired)
    .isLength({ max: 100 }) // specify the maximum length for the title
    .withMessage(validationMessage.general.titleLength),
  body("description")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.descriptionRequired)
    .isLength({ max: 1000 }) // specify the maximum length for the description
    .withMessage(validationMessage.general.descriptionLength),
];
exports.deleteFaqValidator = [
  body("faqIdsToDelete")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.faqIdsReq),
];
exports.updateFaqValidator = [
  body("title")
    .isLength({ max: 100 }) // specify the maximum length for the title
    .withMessage(validationMessage.general.titleLength),
  body("description")
    .isLength({ max: 1000 }) // specify the maximum length for the description
    .withMessage(validationMessage.general.descriptionLength),
];
