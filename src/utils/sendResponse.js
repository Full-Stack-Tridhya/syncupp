const sendResponse = (
  response,
  success = true,
  message,
  data,
  statusCode = 200,
  pagination = undefined
) => {
  response.status(statusCode).json({
    success,
    message,
    data,
    status: statusCode,
    pagination: pagination,
  });
};

module.exports = { sendResponse };
