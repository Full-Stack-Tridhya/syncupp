// This file is used for the catch all of the errors from routes
const ErrorHandler = require("./errorHandler");

module.exports = (err, request, response, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server error";

  //Wrong MongoDb Id Error
  if (err.name === "CastError") {
    const message = `Resource not found.`;
    err = new ErrorHandler(message, 400);
  }

  //Mongoose duplicates key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
    err = new ErrorHandler(message, 400);
  }

  //Wrong JWT Error
  if (err.name === "jsonwebTokenError" || err.name === "JsonWebTokenError") {
    const message = `You are un-authorized!!`;
    err = new ErrorHandler(message, 401);
  }

  //JWT Expired Error
  if (err.name === "TokenExpiredError") {
    const message = `Session Expired, Please login again!`;
    err = new ErrorHandler(message, 401);
  }

  console.log(
    ` /*****************Start*********************
        Date -> ${new Date().toDateString()},
        Time -> ${new Date().toLocaleTimeString()}
    
        ${err.stack}
        
    *******************End*******************/
  `
  );

  response.status(err.statusCode).json({
    success: false,
    message: err.message,
    status: err.statusCode,
  });
};
