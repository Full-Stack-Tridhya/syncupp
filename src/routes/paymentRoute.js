const paymentRoute = require("express").Router();
const paymentConrtoller = require("../controllers/paymentController");
const { protect } = require("../middlewares/authMiddleware");
const adminProtect = require("../middlewares/authAdminMiddleware");

paymentRoute.post("/plan-create", paymentConrtoller.createPlan);
// for start payout
paymentRoute.post("/contact-create", paymentConrtoller.createContact);
// paymentRoute.post("/payout-create", paymentConrtoller.createPayout);
// for end payout

paymentRoute.post("/webhook", paymentConrtoller.webHookHandler);
paymentRoute.get("/plans", paymentConrtoller.listPlan);
paymentRoute.post("/verify-signature", paymentConrtoller.verifySignature);

paymentRoute.get(
  "/plan/:planId",
  adminProtect.protect,
  paymentConrtoller.getPlan
);

paymentRoute.use(protect);

paymentRoute.post("/fund-create", paymentConrtoller.createFundAccount);

paymentRoute.post("/payout-request", paymentConrtoller.requestPayout);

paymentRoute.post("/order", paymentConrtoller.singleTimePayment);
paymentRoute.post("/history", paymentConrtoller.paymentHistory);
paymentRoute.post("/create-subscription", paymentConrtoller.createSubscription);
paymentRoute.post("/sheets", paymentConrtoller.sheetsListing);
paymentRoute.post("/remove-user", paymentConrtoller.removeUser);
paymentRoute.get("/cancel-subscription", paymentConrtoller.cancelSubscription);
paymentRoute.get("/get-subscription", paymentConrtoller.getSubscriptionDetail);
paymentRoute.get("/payment-scopes", paymentConrtoller.paymentScopes);
paymentRoute.post("/referral-payout", paymentConrtoller.referralPay);
paymentRoute.post("/coupon-payout", paymentConrtoller.couponPay);
paymentRoute.get("/de-activated", paymentConrtoller.deactivateAccount);
paymentRoute.patch(
  "/update-subscription-plan",
  paymentConrtoller.updateSubscriptionPlan
);

module.exports = paymentRoute;
