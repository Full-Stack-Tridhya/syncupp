const adminRoute = require("express").Router();
const validatorFunc = require("../utils/validatorFunction.helper");
const cmsController = require("../controllers/cmsController");
const { protect } = require("../middlewares/authAdminMiddleware");
const { validateCreateInquiry } = require("../validators/inquiry.validator");
const { upload } = require("../helpers/multer");
const {
  addTermAndCondition,
  getTermAndCondition,
  updateTermAndCondition,
} = require("../controllers/termAndConditionController");
const {
  addClientReview,
  getAllClientReview,
  deleteClientReview,
  updateClientReview,
  getClientReviewByID,
} = require("../controllers/adminClientReviewController");

// Home
adminRoute.put("/home", cmsController.updateHome);
adminRoute.get("/home", cmsController.getHome);

// Contact Us
adminRoute.put("/contact-us", cmsController.updateContactUs);
adminRoute.get("/contact-us", cmsController.getContactUs);

// Privacy Policy
adminRoute.put("/privacy-policy", cmsController.updatePrivacyPolicy);
adminRoute.get("/privacy-policy", cmsController.getPrivacyPolicy);

// Price Plan
adminRoute.put("/price-plan", cmsController.updatePricePlan);
adminRoute.get("/price-plan", cmsController.getPricePlan);

// technology Plan
adminRoute.put("/technology-stack", cmsController.updateTechnologyStack);
adminRoute.get("/technology-stack", cmsController.getTechnologyStack);

// FAQ
adminRoute.get("/faq", cmsController.getAllFaqCms);

//term and condition
// adminRoute.post("/term-and-condition", addTermAndCondition);
adminRoute.get("/term-and-condition", getTermAndCondition);
adminRoute.put("/term-and-condition", updateTermAndCondition);

//About us
adminRoute.put("/about-us", cmsController.updateAboutUs);
adminRoute.get("/about-us", cmsController.getAboutUs);

adminRoute.get("/get-client-review/:id", getClientReviewByID);
adminRoute.post("/get-client-review", getAllClientReview);

adminRoute.post(
  "/add-client-review",
  upload.single("client_review_image"),
  addClientReview
);
adminRoute.put(
  "/update-client-review/:id",
  upload.single("client_review_image"),
  updateClientReview
);
adminRoute.delete("/delete-client-review", validatorFunc, deleteClientReview);

adminRoute.put(
  "/Cancellation-and-Refund",
  cmsController.updatecancellationAndRefund
);
adminRoute.get(
  "/Cancellation-and-Refund",
  cmsController.getcancellationAndRefund
);
adminRoute.put(
  "/Shipping-and-Delivery",
  cmsController.updateShippingandDelivery
);
adminRoute.get("/Shipping-and-Delivery", cmsController.getShippingandDelivery);

adminRoute.put("/Feature", cmsController.updateFeature);
adminRoute.get("/Feature", cmsController.getFeature);
module.exports = adminRoute;
