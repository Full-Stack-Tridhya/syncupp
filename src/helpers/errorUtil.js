const ErrorHandler = require("./errorHandler");

// this function is used for the throw an error from the service
exports.throwError = (message, status_code = 400) => {
  throw new ErrorHandler(message, status_code);
};
