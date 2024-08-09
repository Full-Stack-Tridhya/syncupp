const adminRoute = require("express").Router();
const {
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  getAdmin,
  updateAdmin,
  getAgency,
  transactionHistory,
  dashboardData,
  agencyDownload,
  PendingPayout,
  createPayout,
  paymentDownload,
  extendTrialPeriod,
  agencyPaymentDetail,
  manualPayment,
  getNotification,
  readNotification,
} = require("../controllers/adminController");
const validatorFunc = require("../utils/validatorFunction.helper");
const agencyController = require("../controllers/agencyController");
const {
  resetPasswordValidator,
  loginAdminValidator,
  forgotPasswordValidator,
  updatePasswordValidator,
} = require("../validators/admin.validator");
const { protect } = require("../middlewares/authAdminMiddleware");
const {
  addFaq,
  getAllFaq,
  deleteFaq,
  updateFaq,
  getFaq,
} = require("../controllers/faqController");
const {
  deleteFaqValidator,
  updateFaqValidator,
  addFaqValidator,
} = require("../validators/faq.validator");
const {
  addClientReview,
  getAllClientReview,
  deleteClientReview,
  updateClientReview,
  getClientReviewByID,
} = require("../controllers/adminClientReviewController");
const {
  addClientReviewValidator,
  deleteClientReviewValidator,
  updateClientReviewValidator,
} = require("../validators/clientReview.validator");
const { upload } = require("../helpers/multer");
const notificationController = require("../controllers/notificationController");

//coupon code start
const { deleteCouponValidator } = require("../validators/coupon.validator");

const {
  addCoupon,
  deleteCoupon,
  updateCoupon,
  getCouponList,
  getCoupon,
} = require("../controllers/couponController");
//coupon code end

// this route is used for the ADMIN panel Login
adminRoute.post("/login", loginAdminValidator, validatorFunc, login);

adminRoute.post("/forgotPassword", forgotPassword);
adminRoute.post(
  "/resetPassword",
  resetPasswordValidator,
  validatorFunc,
  resetPassword
);

adminRoute.use(protect);

// FAQ

adminRoute.post("/add-faq", addFaqValidator, validatorFunc, addFaq);
adminRoute.post("/get-all-faq", getAllFaq);
adminRoute.delete("/delete-faq", deleteFaqValidator, validatorFunc, deleteFaq);
adminRoute.put("/update-faq/:id", updateFaqValidator, validatorFunc, updateFaq);
adminRoute.get("/get-faq/:id", getFaq);

adminRoute.post("/agency/get", getAgency);
adminRoute.put(
  "/updatePassword",
  updatePasswordValidator,
  validatorFunc,
  changePassword
);
adminRoute.get("/getProfile", getAdmin);
adminRoute.put("/updateProfile", updateAdmin);

adminRoute.post("/add-faq", addFaqValidator, validatorFunc, addFaq);
adminRoute.post("/get-all-faq", getAllFaq);
adminRoute.delete("/delete-faq", deleteFaqValidator, validatorFunc, deleteFaq);
adminRoute.put("/update-faq/:id", updateFaqValidator, validatorFunc, updateFaq);
adminRoute.get("/get-faq/:id", getFaq);

// Client Review APIs
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
adminRoute.delete(
  "/delete-client-review",
  deleteClientReviewValidator,
  validatorFunc,
  deleteClientReview
);

adminRoute.post("/agencies", agencyController.getAllAgency);
adminRoute.patch("/update-agency", agencyController.updateAgency);

adminRoute.post("/add-coupon", upload.single("brandLogo"), addCoupon);
adminRoute.get("/get-coupon/:id", getCoupon);
adminRoute.put("/update-coupon/:id", upload.single("brandLogo"), updateCoupon);
adminRoute.delete(
  "/delete-coupon",
  deleteCouponValidator,
  validatorFunc,
  deleteCoupon
);

adminRoute.post("/get-coupon-list", getCouponList);
adminRoute.post("/transaction", transactionHistory);
adminRoute.get("/dashboard", dashboardData);
adminRoute.get("/agency-download", agencyDownload);
adminRoute.get("/payment-download", paymentDownload);

adminRoute.post("/payout-list", PendingPayout);
adminRoute.post("/payout-create", createPayout);
// ------------------------ Notification ------------------------
adminRoute.get("/notification", getNotification);
adminRoute.post("/notification/read-notification", readNotification);

// ------------------------ Notification ------------------------

// extend the trial period of the user
adminRoute.patch("/extend-trial", extendTrialPeriod);
adminRoute.get("/agency-payment/:agency_id", agencyPaymentDetail);
adminRoute.post("/manual-payment", manualPayment);

module.exports = adminRoute;
