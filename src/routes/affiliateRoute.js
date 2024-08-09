const affiliateRoute = require("express").Router();
const validatorFunc = require("../utils/validatorFunction.helper");
const affiliateController = require("../controllers/affiliateController");
const { protect } = require("../middlewares/affiliateAdminMiddleware");
const {
  validateAffiliateRegistration,
  validateAffiliateLogin,
  validateAffiliateResetPassword,
} = require("../validators/affiliate.validator");

affiliateRoute.post(
  "/login",
  validateAffiliateLogin,
  validatorFunc,
  affiliateController.login
);

affiliateRoute.post(
  "/signup",
  validateAffiliateRegistration,
  validatorFunc,
  affiliateController.signUp
);

affiliateRoute.post("/forgot-password", affiliateController.forgotPassword);
affiliateRoute.post(
  "/reset-password",
  validateAffiliateResetPassword,
  validatorFunc,
  affiliateController.resetPassword
);
affiliateRoute.post("/click-count", affiliateController.clickCount);

affiliateRoute.use(protect);
affiliateRoute.post("/fund-create", affiliateController.createFundAccount);

affiliateRoute.post("/payout-request", affiliateController.requestPayout);
affiliateRoute.get("/fetch-account", affiliateController.fetchaccount);
affiliateRoute.post("/change-password", affiliateController.changePassword);
affiliateRoute.get("/get-profile", affiliateController.getProfile);
affiliateRoute.put("/update-profile", affiliateController.updateProfile);
affiliateRoute.get("/dashboard", affiliateController.getDashboardData);

module.exports = affiliateRoute;
