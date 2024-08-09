const inquiryRoute = require("express").Router();
const validatorFunc = require("../utils/validatorFunction.helper");
const inquiryController = require("../controllers/inquiryController");
const { protect } = require("../middlewares/authAdminMiddleware");
const { validateCreateInquiry } = require("../validators/inquiry.validator");

inquiryRoute.post(
  "/send-inquiry",
  validateCreateInquiry,
  validatorFunc,
  inquiryController.addInquiry
);

inquiryRoute.use(protect);

inquiryRoute.post("/get-all", inquiryController.getAllInquiry);
inquiryRoute.delete("/", inquiryController.deleteInquiry);

module.exports = inquiryRoute;
