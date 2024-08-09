const { validationResult } = require("express-validator");
const { sendResponse } = require("./sendResponse");

// show validation error message
const validatorFunc = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("VALIDATION....", errors.array()[0].msg);
    return sendResponse(res, false, errors.array()[0].msg, null, 400);
  }
  next();
};

module.exports = validatorFunc;
