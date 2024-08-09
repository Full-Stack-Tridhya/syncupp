const { body } = require("express-validator");
const validationMessage = require("../messages/valiation.json");

exports.addTermAndConditionValidator = [
  body("description")
    .not()
    .isEmpty()
    .withMessage(validationMessage.general.descriptionRequired)
    .isLength({ max: 1000 }) // specify the maximum length for the description
    .withMessage(validationMessage.general.descriptionLength),
];
