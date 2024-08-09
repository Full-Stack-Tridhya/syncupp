const catchAsyncError = require("../helpers/catchAsyncError");
const { sendResponse } = require("../utils/sendResponse");
const PaymentService = require("../services/paymentService");
const { returnMessage } = require("../utils/utils");
const paymentService = new PaymentService();

exports.createPlan = catchAsyncError(async (req, res, next) => {
  await paymentService.createPlan(req.body);
  sendResponse(res, true, returnMessage("payment", "planCreated"), {}, 200);
});

exports.createSubscription = catchAsyncError(async (req, res, next) => {
  const subscription = await paymentService.subscription(req.body, req.user);
  sendResponse(
    res,
    true,
    returnMessage("payment", "checkoutLinkGenerated"),
    subscription,
    200
  );
});

exports.webHookHandler = catchAsyncError(async (req, res, next) => {
  await paymentService.webHookHandlar(req);
  sendResponse(res, true, "", {}, 200);
});

exports.verifySignature = catchAsyncError(async (req, res, next) => {
  const verified = await paymentService.verifySignature(req.body, req.user);
  /* let message = verified?.message;
  if (!verified?.success) message = returnMessage("payment", "paymentFailed"); */
  sendResponse(
    res,
    true,
    returnMessage("payment", "paymentCompleted"),
    verified,
    200
  );
});

exports.singleTimePayment = catchAsyncError(async (req, res, next) => {
  const order = await paymentService.oneTimePayment(req.body, req.user);
  sendResponse(res, true, returnMessage("payment", "orderCreated"), order, 200);
});

exports.paymentHistory = catchAsyncError(async (req, res, next) => {
  const histories = await paymentService.paymentHistory(req.body, req.user);
  sendResponse(
    res,
    true,
    returnMessage("payment", "paymentHistoryFetched"),
    histories,
    200
  );
});

exports.sheetsListing = catchAsyncError(async (req, res, next) => {
  const sheets = await paymentService.sheetsListing(req.body, req.user);
  sendResponse(
    res,
    true,
    returnMessage("payment", "sheetsFetched"),
    sheets,
    200
  );
});

exports.removeUser = catchAsyncError(async (req, res, next) => {
  const remove_user = await paymentService.removeUser(req.body, req.user);

  sendResponse(
    res,
    true,
    !remove_user?.force_fully_remove
      ? returnMessage("payment", "userRemoved")
      : undefined,
    remove_user,
    200
  );
});

exports.cancelSubscription = catchAsyncError(async (req, res, next) => {
  await paymentService.cancelSubscription(req.user);
  sendResponse(
    res,
    true,
    returnMessage("payment", "subscriptionCancelled"),
    {},
    200
  );
});

exports.getSubscriptionDetail = catchAsyncError(async (req, res, next) => {
  const subscription_detail = await paymentService.getSubscription(req.user);
  sendResponse(
    res,
    true,
    returnMessage("payment", "subscriptionFetched"),
    subscription_detail,
    200
  );
});

// payment using referral point
exports.referralPay = catchAsyncError(async (req, res, next) => {
  const verified = await paymentService.referralPay(req.body, req.user);
  let message = verified?.message;
  if (!verified?.success) message = returnMessage("payment", "paymentFailed");
  sendResponse(res, true, message, verified, 200);
});

exports.paymentScopes = catchAsyncError(async (req, res, next) => {
  const paymentScopes = await paymentService.paymentScopes(req.user);
  sendResponse(res, true, undefined, paymentScopes, 200);
});

exports.couponPay = catchAsyncError(async (req, res, next) => {
  const verified = await paymentService.couponPay(req.body, req.user);
  sendResponse(
    res,
    true,
    returnMessage("payment", "couponpurchase"),
    verified,
    200
  );
});

exports.deactivateAccount = catchAsyncError(async (req, res, next) => {
  await paymentService.deactivateAgency(req.user);
  sendResponse(
    res,
    true,
    returnMessage("payment", "accountDeactivated"),
    {},
    200
  );
});

// Get plan

exports.getPlan = catchAsyncError(async (req, res, next) => {
  const plan = await paymentService.getPlan(req?.params);
  sendResponse(res, true, returnMessage("payment", "planFetched"), plan, 200);
});

// List plan

exports.listPlan = catchAsyncError(async (req, res, next) => {
  const plans = await paymentService.listPlan();
  sendResponse(res, true, returnMessage("payment", "plansFetched"), plans, 200);
});

// update the plan in the Subscription
exports.updateSubscriptionPlan = catchAsyncError(async (req, res, next) => {
  const updated_plan = await paymentService.updateSubscriptionPlan(
    req.body,
    req.user
  );
  sendResponse(
    res,
    true,
    returnMessage("payment", "subscriptionPlanUpdate"),
    updated_plan,
    200
  );
});

exports.createContact = catchAsyncError(async (req, res, next) => {
  const contact_detail = await paymentService.createContact(req.body);
  sendResponse(
    res,
    true,
    returnMessage("payment", "createContact"),
    contact_detail,
    200
  );
});

exports.createFundAccount = catchAsyncError(async (req, res, next) => {
  const fund_detail = await paymentService.creatFundAccount(req.body, req.user);
  sendResponse(
    res,
    true,
    returnMessage("payment", "createFundAccount"),
    fund_detail,
    200
  );
});

exports.PendingPayout = catchAsyncError(async (req, res, next) => {
  const PendingPayout = await paymentService.pendingpayout();
  sendResponse(
    res,
    true,
    returnMessage("payment", "payoutlist"),
    PendingPayout,
    200
  );
});

exports.createPayout = catchAsyncError(async (req, res, next) => {
  const createPayout = await paymentService.createPayouts(req.body);
  sendResponse(
    res,
    true,
    returnMessage("payment", "createPayout"),
    createPayout,
    200
  );
});

exports.requestPayout = catchAsyncError(async (req, res, next) => {
  const requestPayout = await paymentService.requestforPayout(
    req.user,
    req.body
  );
  sendResponse(
    res,
    true,
    returnMessage("payment", "requestPayout"),
    requestPayout,
    200
  );
});
