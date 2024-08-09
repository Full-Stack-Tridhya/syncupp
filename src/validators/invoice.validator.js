const { body } = require("express-validator");
const validationMessage = require("../messages/valiation.json");

exports.validateCreateInvoice = [
  body("invoice_number")
    .notEmpty()
    .withMessage(validationMessage.invoice.invoiceNumberRequired)
    .isString()
    .withMessage(validationMessage.invoice.invoiceNumberString),

  // body("client_id")
  //   .isMongoId()
  //   .withMessage(validationMessage.invoice.clientIdInvalid),

  body("due_date")
    .notEmpty()
    .withMessage(validationMessage.invoice.dueDateRequired)
    .isISO8601()
    .toDate()
    .withMessage(validationMessage.invoice.dueDateInvalid),

  body("invoice_date")
    .notEmpty()
    .withMessage(validationMessage.invoice.invoiceDateRequired)
    .isISO8601()
    .toDate()
    .withMessage(validationMessage.invoice.invoiceDateInvalid),

  body("invoice_content")
    .notEmpty()
    .withMessage(validationMessage.invoice.invoiceContentRequired),

  // body("invoice_content.*.item")
  //   .notEmpty()
  //   .withMessage(validationMessage.invoice.itemRequired),

  // body("invoice_content.*.qty")
  //   .notEmpty()
  //   .withMessage(validationMessage.invoice.qtyRequired)
  //   .isNumeric()
  //   .withMessage(validationMessage.invoice.qtyNumeric)
  //   .custom((value) => {
  //     // Check if the quantity has 0 digits after the decimal point
  //     const decimalPart = value.toString().split(".")[1];
  //     return !decimalPart || decimalPart.length === 0;
  //   })
  //   .withMessage(validationMessage.invoice.decimalLengthExceed),

  // body("invoice_content.*.rate")
  //   .notEmpty()
  //   .withMessage(validationMessage.invoice.rateRequired)
  //   .isNumeric()
  //   .withMessage(validationMessage.invoice.rateNumeric)
  //   .custom((value) => {
  //     // Check if there are at most 2 digits after the decimal point
  //     const decimalPart = value.toString().split(".")[1];
  //     return !decimalPart || decimalPart.length <= 2;
  //   })
  //   .withMessage(validationMessage.invoice.decimalLength),

  // body("invoice_content.*.tax")
  //   .notEmpty()
  //   .withMessage(validationMessage.invoice.taxRequired)
  //   .isNumeric()
  //   .withMessage(validationMessage.invoice.taxNumeric)
  //   .custom((value) => {
  //     // Check if there are at most 2 digits after the decimal point
  //     const decimalPart = value.toString().split(".")[1];
  //     return !decimalPart || decimalPart.length <= 2;
  //   })
  //   .withMessage(validationMessage.invoice.decimalLength),

  // body("invoice_content.*.description")
  //   .notEmpty()
  //   .withMessage(validationMessage.invoice.descriptionRequired),
];
