const Razorpay = require("razorpay");
const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const SubscriptionPlan = require("../models/subscriptionplanSchema");
const Authentication = require("../models/authenticationSchema");
const Client = require("../models/clientSchema");
const Team_Client = require("../models/teamClientSchema");
const PaymentHistory = require("../models/paymentHistorySchema");
const SheetManagement = require("../models/sheetManagementSchema");
const {
  returnMessage,
  invitationEmail,
  paginationObject,
  capitalizeFirstLetter,
  getKeywordType,
  returnNotification,
  templateMaker,
  memberDetail,
} = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const crypto = require("crypto");
const moment = require("moment");
const sendEmail = require("../helpers/sendEmail");
const Configuration = require("../models/configurationSchema");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});
const axios = require("axios");
const AdminCoupon = require("../models/adminCouponSchema");
const Affiliate_Referral = require("../models/affiliateReferralSchema");
const Invoice = require("../models/invoiceSchema");
const Agreement = require("../models/agreementSchema");
const { eventEmitter } = require("../socket");
const NotificationService = require("./notificationService");
const notificationService = new NotificationService();
const Affiliate = require("../models/affiliateSchema");
const Payout = require("../models/payoutSchema");
const Notification = require("../models/notificationSchema");
const Workspace = require("../models/workspaceSchema");
const Task = require("../models/taskSchema");
const Order_Management = require("../models/orderManagementSchema");
const Role_Master = require("../models/masters/roleMasterSchema");
const Gamification = require("../models/gamificationSchema");

class PaymentService {
  constructor() {
    this.razorpayApi = axios.create({
      baseURL: "https://api.razorpay.com/v1",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_SECRET}`
        ).toString("base64")}`,
      },
    });
  }

  createPlan = async (payload) => {
    try {
      if (payload?.products?.length > 0) {
        await SubscriptionPlan.updateMany({}, { active: false });
      }

      // this will create the product from the Backend
      payload?.products?.forEach(async (product) => {
        const planData = {
          period: product?.period,
          interval: 1, // Charge every month
          item: {
            name: product?.name,
            description: product?.description,
            amount: product?.amount * 100, // Amount in paise (6000 INR)
            currency: product?.currency,
          },
        };
        const plan = await razorpay.plans.create(planData);

        if (plan) {
          await SubscriptionPlan.create({
            amount: product?.amount * 100,
            currency: product?.currency,
            description: product?.description,
            plan_id: plan?.id,
            period: product?.period,
            name: product?.name,
            active: true,
            symbol: product?.symbol,
            seat: product?.seat,
            sort_value: product?.sort_value,
            plan_type: product?.plan_type,
          });
        }
        return;
      });
    } catch (error) {
      console.log(JSON.stringify(error));
      logger.error(`Error while creating the plan: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  subscription = async (payload, user) => {
    try {
      if (
        user?.workspace_detail?.created_by?.toString() !== user?._id?.toString()
      )
        return throwError(
          returnMessage("auth", "forbidden"),
          statusCode.forbidden
        );

      const member_details = user?.workspace_detail?.members?.find(
        (member) => member?.user_id?.toString() === user?._id?.toString()
      );
      if (!member_details)
        return throwError(returnMessage("default", "default"));

      const is_free_trial_completed = await PaymentHistory.findOne({
        payment_mode: "free_trial",
        agency_id: user?._id,
        is_deleted: false,
      }).lean();

      if (
        (is_free_trial_completed &&
          user?.subscription_id &&
          user?.subscribe_date) ||
        member_details?.status !== "payment_pending"
      )
        return throwError(returnMessage("payment", "alreadyPaid"));

      // removed as we are managing the free trial from the Razorpay itself
      /*  if (user?.workspace_detail?.trial_end_date)
        return throwError(returnMessage("payment", "freeTrialOn")); */

      const [plan, sheets, configuration] = await Promise.all([
        SubscriptionPlan.findOne({ plan_type: "unlimited" }).lean(),
        SheetManagement.findOne({
          user_id: user?._id,
          is_deleted: false,
        }).lean(),
        Configuration.findOne().lean(),
      ]);

      if (!plan || !plan?.active)
        return throwError(
          returnMessage("payment", "planNotFound"),
          statusCode.notFound
        );

      const subscription_obj = {
        plan_id: plan?.plan_id,
        quantity: sheets?.total_sheets || 1,
        customer_notify: 1,
        total_count: 60,
      };

      if (configuration?.payment?.free_trial > 0 && !is_free_trial_completed) {
        const trial_days = moment
          .utc()
          .startOf("day")
          .add(configuration?.payment?.free_trial, "days");
        subscription_obj.start_at = trial_days.unix();
      }

      if (
        user?.email === "smitvasoya2001@gmail.com" ||
        user?.email === "solankiprashant512@gmail.com" ||
        user?.email === "mukund.d@tridhyatech.com" ||
        user?.email === "ritwik101001@gmail.com" ||
        user?.email === "surgelionmediateam@gmail.com"
      ) {
        const trial_days = moment.utc().add(5, "minutes");
        subscription_obj.start_at = trial_days.unix();
      }

      if (plan?.plan_type === "unlimited") {
        subscription_obj.quantity = 1;
      }
      // commenting because to test the razorpay axios api call

      return razorpay.subscriptions
        .create(subscription_obj)
        .then(async (subscription) => {
          console.log(subscription);
          await Authentication.findByIdAndUpdate(
            user?._id,
            { subscription_id: subscription?.id, purchased_plan: plan?._id },
            { new: true }
          );

          await Order_Management.create({
            subscription_id: subscription?.id,
            amount:
              plan?.plan_type === "unlimited"
                ? plan?.amount * 1
                : plan?.amount * (sheets?.total_sheets || 1),
            currency: plan?.currency,
            agency_id: user?._id,
            email: user?.email,
            contact_number: user?.contact_number,
            workspace_id: user?.workspace_detail?._id,
            plan_id: plan?.plan_id,
          });

          return {
            payment_id: subscription?.id,
            amount:
              plan?.plan_type === "unlimited"
                ? plan?.amount * 1
                : plan?.amount * (sheets?.total_sheets || 1),
            currency: plan?.currency,
            agency_id: user?._id,
            email: user?.email,
            contact_number: user?.contact_number,
            workspace: user?.workspace_detail?._id,
          };
        })
        .catch((error) => {
          logger.error(`Error with subscription generate: ${error}`);
          console.log(error);
        });
      // creating the customer to the razorpay
      // this.razorpayApi.post("/customers", {
      //   name: user?.first_name + " " + user?.last_name,
      //   email: user?.email,
      //   fail_existing: 0,
      // });

      // const { data } = await this.razorpayApi.post(
      //   "/subscriptions",
      //   subscription_obj
      // );
    } catch (error) {
      console.log("Error while subscription create", error);
      logger.error(`Error while creating subscription: ${error}`);
      return throwError(
        error?.message || error?.error?.description,
        error?.statusCode
      );
    }
  };

  webHookHandlar = async (request) => {
    try {
      const { body, headers } = request;

      // verify webhook signature is commented because it is not working for the invoice paid event
      // const razorpaySignature = headers["x-razorpay-signature"];
      // const signature = crypto
      //   .createHmac("sha256", process.env.WEBHOOK_SECRET)
      //   .update(JSON.stringify(body))
      //   .digest("hex");
      //   if (razorpaySignature !== signature)
      //     return throwError(
      //       returnMessage("payment", "invalidSignature"),
      //       statusCode.forbidden
      //     );

      // await PaymentHistory.create({
      //   agency_id,
      //   amount,
      //   subscription_id,
      //   currency,
      //   payment_id: razorpay_payment_id,
      // });

      console.log(JSON.stringify(body), 100);

      if (body) {
        const { payload } = body;

        if (body?.event === "subscription.authenticated") {
          const subscription_id = payload?.subscription?.entity?.id;
          const plan_id = payload?.subscription?.entity?.plan_id;
          const quantity = payload?.subscription?.entity?.quantity;

          const [agency_detail, plan, order_management, configuration] =
            await Promise.all([
              Authentication.findOne({ subscription_id }).lean(),
              SubscriptionPlan.findOne({ plan_id }).lean(),
              Order_Management.findOne({
                subscription_id,
                is_deleted: false,
              }).lean(),
              Configuration.findOne().lean(),
            ]);

          if (order_management) {
            await Promise.all([
              Authentication.findByIdAndUpdate(order_management?.agency_id, {
                purchased_plan: plan?._id,
                subscribe_date: moment().format("YYYY-MM-DD").toString(),
              }),
            ]);
            return;
          }

          // this is used if the user has already used the trial period and due to the cron the job the status will be payment pending and trial end date will be null
          // so we will just return if user had compled trial period
          const is_free_trial_completed = await PaymentHistory.findOne({
            payment_mode: "free_trial",
            agency_id: order_management?.agency_id,
            is_deleted: false,
          }).lean();
          if (is_free_trial_completed) return;

          await PaymentHistory.create({
            agency_id: agency_detail?._id,
            subscription_id,
            plan_id,
            quantity,
            payment_mode: "free_trial",
            workspace_id: order_management?.workspace_id,
          });

          if (plan?.plan_type === "unlimited") {
            await SheetManagement.findByIdAndUpdate(
              order_management?.agency_id,
              { total_sheets: plan?.seat }
            );
          }

          // this is used when user do the payment after creating the workspace so long time
          if (configuration?.payment?.free_trial > 0) {
            await Workspace.findByIdAndUpdate(order_management?.workspace_id, {
              $set: {
                trial_end_date: moment
                  .utc()
                  .startOf("day")
                  .add(configuration?.payment?.free_trial, "days"),
              },
            });
          }

          await Promise.all([
            Authentication.findByIdAndUpdate(order_management?.agency_id, {
              purchased_plan: plan?._id,
              subscribe_date: moment().format("YYYY-MM-DD").toString(),
            }),
            Workspace.findOneAndUpdate(
              {
                _id: order_management?.workspace_id,
                created_by: order_management?.agency_id,
                "members.user_id": order_management?.agency_id,
                is_deleted: false,
              },
              {
                $set: { "members.$.status": "confirmed" },
              }
            ),
            Order_Management.findByIdAndUpdate(order_management?._id, {
              is_deleted: true,
            }),
          ]);
          const sheets = await SheetManagement.findOne({
            user_id: order_management?.agency_id,
            is_deleted: false,
          }).lean();
          if (!sheets)
            await SheetManagement.findOneAndUpdate(
              { user_id: order_management?.agency_id },
              {
                user_id: order_management?.agency_id,
                total_sheets: 1,
                occupied_sheets: [],
              },
              { upsert: true }
            );
          return;
        } else if (body?.event === "subscription.charged") {
          const subscription_id = payload?.subscription?.entity?.id;
          const payment_id = payload?.payment?.entity?.id;
          const currency = payload?.payment?.entity?.currency;
          const amount = payload?.payment?.entity?.amount;
          const plan_id = payload?.subscription?.entity?.plan_id;
          const quantity = payload?.subscription?.entity?.quantity;

          const [agency_detail, plan, order_management, payment_history] =
            await Promise.all([
              Authentication.findOne({ subscription_id }).lean(),
              SubscriptionPlan.findOne({ plan_id }).lean(),
              Order_Management.findOne({
                subscription_id,
                is_deleted: false,
              }).lean(),
              PaymentHistory.findOne({ payment_id }).lean(),
            ]);

          if (!payment_history) {
            const workspace_id = await Workspace.findOne({
              created_by: agency_detail?._id,
              is_deleted: false,
            }).lean();
            await PaymentHistory.create({
              agency_id: agency_detail?._id,
              amount,
              subscription_id,
              currency,
              payment_id,
              plan_id,
              quantity,
              workspace_id: workspace_id?._id,
            });
          }
          if (order_management) {
            await Promise.all([
              Authentication.findByIdAndUpdate(order_management?.agency_id, {
                purchased_plan: plan?._id,
                subscribe_date: moment().format("YYYY-MM-DD").toString(),
              }),
            ]);
            return;
          }

          if (plan?.plan_type === "unlimited") {
            await SheetManagement.findByIdAndUpdate(
              order_management?.agency_id,
              { total_sheets: plan?.seat }
            );
          }

          await Promise.all([
            Authentication.findByIdAndUpdate(order_management?.agency_id, {
              purchased_plan: plan?._id,
              subscribe_date: moment().format("YYYY-MM-DD").toString(),
            }),
            Workspace.findOneAndUpdate(
              {
                _id: order_management?.workspace_id,
                created_by: order_management?.agency_id,
                "members.user_id": order_management?.agency_id,
                is_deleted: false,
              },
              {
                $set: {
                  "members.$.status": "confirmed",
                  trial_end_date: null,
                },
              }
            ),
            Order_Management.findByIdAndUpdate(order_management?._id, {
              is_deleted: true,
            }),
          ]);
          const sheets = await SheetManagement.findOne({
            user_id: order_management?.agency_id,
            is_deleted: false,
          }).lean();
          if (!sheets)
            await SheetManagement.findOneAndUpdate(
              { user_id: order_management?.agency_id },
              {
                user_id: order_management?.agency_id,
                total_sheets: 1,
                occupied_sheets: [],
              },
              { upsert: true }
            );
          return;
        } else if (body?.event === "subscription.activated") {
          const subscription_id = payload?.subscription?.entity?.id;
          const agency_details = await Authentication.findOne({
            subscription_id,
          }).lean();

          if (agency_details && agency_details?.subscription_halted) {
            await Authentication.findByIdAndUpdate(agency_details?._id, {
              subscription_halted: null,
            });
            await Workspace.findOneAndUpdate(
              {
                created_by: agency_details?._id,
                "members.user_id": agency_details?._id,
              },
              {
                $set: {
                  "members.$.status": "confirmed",
                  trial_end_date: null,
                },
              }
            );
          }

          await Affiliate_Referral.findOneAndUpdate(
            {
              referred_to: agency_details?._id,
              status: "inactive",
            },
            {
              $set: {
                status: "active",
                payment_id: payload?.subscription?.entity?.plan_id,
              },
            },
            { new: true }
          );

          let affilate_detail = await Affiliate_Referral.findOne({
            referred_to: agency_details?._id,
            status: "active",
          }).lean();
          const [affiliateCheck, crmAffiliate, referral_data] =
            await Promise.all([
              Affiliate.findById(affilate_detail?.referred_by).lean(),
              Authentication.findById(affilate_detail?.referred_by).lean(),
              Configuration.findOne().lean(),
            ]);

          if (affiliateCheck) {
            await Affiliate.findByIdAndUpdate(
              affiliateCheck._id,
              {
                $inc: {
                  affiliate_point:
                    referral_data?.referral?.successful_referral_point,
                  total_affiliate_earned_point:
                    referral_data?.referral?.successful_referral_point,
                },
              },
              { new: true }
            );
          }
          if (crmAffiliate) {
            await Authentication.findByIdAndUpdate(
              crmAffiliate?._id,
              {
                $inc: {
                  affiliate_point:
                    referral_data?.referral?.successful_referral_point,
                  total_affiliate_earned_point:
                    referral_data?.referral?.successful_referral_point,
                },
              },
              { new: true }
            );
          }

          return;
        } else if (
          body?.event === "subscription.halted" ||
          body?.event === "subscription.pending"
        ) {
          const subscription_id = payload?.subscription?.entity?.id;
          const agency_details = await Authentication.findOne({
            subscription_id,
          }).lean();

          if (agency_details && !agency_details?.subscription_halted) {
            await Authentication.findByIdAndUpdate(agency_details?._id, {
              subscription_halted: moment.utc().startOf("day"),
            });
          }

          return;
        } else if (body?.event === "order.paid") {
          const order_id = payload?.order?.entity?.id;
          const payment_id = payload?.payment?.entity?.id;
          const currency = payload?.payment?.entity?.currency;
          const amount = payload?.payment?.entity?.amount;
          const order_management = await Order_Management.findOne({
            order_id,
            is_deleted: false,
          }).lean();
          if (!order_management) return;
          const [
            agency_details,
            user_details,
            sheets,
            workspace_exist,
            configuration,
          ] = await Promise.all([
            Authentication.findById(order_management?.agency_id).lean(),
            Authentication.findById(order_management?.member_id).lean(),
            SheetManagement.findOne({
              user_id: order_management?.agency_id,
              is_deleted: false,
            }).lean(),
            Workspace.findById(order_management?.workspace_id).lean(),
            Configuration.findOne().lean(),
          ]);
          const member_detail = workspace_exist?.members?.find(
            (member) =>
              member?.user_id?.toString() === user_details?._id?.toString()
          );
          let invitation_token = crypto.randomBytes(16).toString("hex");
          const link = `${process.env.REACT_APP_URL}/verify?workspace=${
            workspace_exist?._id
          }&email=${encodeURIComponent(
            user_details?.email
          )}&token=${invitation_token}&workspace_name=${
            workspace_exist?.name
          }&first_name=${user_details?.first_name}&last_name=${
            user_details?.last_name
          }`;

          const email_template = templateMaker("teamInvitation.html", {
            REACT_APP_URL: process.env.REACT_APP_URL,
            SERVER_URL: process.env.SERVER_URL,
            username:
              capitalizeFirstLetter(user_details?.first_name) +
              " " +
              capitalizeFirstLetter(user_details?.last_name),
            invitation_text: `You are invited to the ${capitalizeFirstLetter(
              workspace_exist?.name
            )} workspace by ${
              capitalizeFirstLetter(agency_details?.first_name) +
              " " +
              capitalizeFirstLetter(agency_details?.last_name)
            }. Click on the below link to join the workspace.`,
            link: link,
            instagram: configuration?.urls?.instagram,
            facebook: configuration?.urls?.facebook,
            privacy_policy: configuration?.urls?.privacy_policy,
          });

          sendEmail({
            email: user_details?.email,
            subject: returnMessage("auth", "invitationEmailSubject"),
            message: email_template,
          });

          await Promise.all([
            PaymentHistory.create({
              agency_id: order_management?.agency_id,
              member_id: user_details?._id,
              amount,
              order_id,
              currency,
              role: member_detail?.role,
              payment_id,
            }),
            Workspace.findOneAndUpdate(
              {
                _id: workspace_exist?._id,
                "members.user_id": user_details?._id,
              },
              {
                $set: {
                  "members.$.status": "confirm_pending",
                  "mwmbers.$.invitation_token": invitation_token,
                },
              }
            ),
            this.updateSubscription(
              order_management?.agency_id,
              sheets?.total_sheets
            ),
            Order_Management.findByIdAndUpdate(order_management?._id, {
              is_deleted: true,
            }),
          ]);

          return;
        }
      }

      return;
    } catch (error) {
      console.log(JSON.stringify(error));

      console.log(`Error with webhook handler`, error);
      return throwError(
        error?.message || error?.error?.description,
        error.status
      );
    }
  };

  customPaymentCalculator = (
    subscription_start_date,
    renew_subscription_date,
    plan
  ) => {
    try {
      const start_date = moment.unix(subscription_start_date).startOf("day");
      const renew_date = moment.unix(renew_subscription_date).endOf("day");

      const paymentMoment = moment().startOf("day");

      // days difference between payment start and renew subscription date
      const days_diff = Math.abs(paymentMoment.diff(renew_date, "days"));
      console.log("Days diff", days_diff);
      // calculate the total days between subscription dates
      const total_days = Math.abs(renew_date.diff(start_date, "days"));
      console.log("total days", total_days);

      const proratedAmount = (plan?.amount / total_days) * days_diff;
      console.log("prorated value", proratedAmount);
      if (paymentMoment.isSame(start_date)) return plan?.amount;

      return proratedAmount.toFixed(2);
    } catch (error) {
      console.log(JSON.stringify(error));

      logger.error(`Error while calculating the custom payment: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  oneTimePayment = async (payload, user) => {
    try {
      // removed the one time payment because only Agency allowed to do payment
      // let check_agency = await Team_Agency.findById(user?.reference_id)
      //   .populate("role", "name")
      //   .lean();
      // if (user?.role?.name !== "agency") {
      //   if (check_agency?.role?.name !== "admin") {
      //     return throwError(
      //       returnMessage("auth", "forbidden"),
      //       statusCode.forbidden
      //     );
      //   }
      // }
      // if (check_agency?.role?.name === "admin") {
      //   let agency_data = await Authentication.findOne({
      //     reference_id: check_agency?.agency_id,
      //   }).lean();
      //   user.status = agency_data?.status;
      //   user.subscribe_date = agency_data?.subscribe_date;
      //   user.subscription_id = agency_data?.subscription_id;
      // }

      if (user?.workspace_detail?.trial_end_date)
        return throwError(returnMessage("payment", "freeTrialOn"));

      const member_details = user?.workspace_detail?.members?.find(
        (member) => member?.user_id?.toString() === user?._id?.toString()
      );

      if (
        member_details?.status === "payment_pending" ||
        !user?.subscribe_date ||
        !user?.subscription_id
      )
        return throwError(returnMessage("payment", "agencyPaymentPending"));

      if (!payload?.user_id)
        return throwError(returnMessage("payment", "userIdRequried"));

      const agency_exist = this.checkAgencyExist(payload?.user_id, user);

      if (!agency_exist) return throwError(returnMessage("default", "default"));

      const plan = await SubscriptionPlan.findById(user?.purchased_plan).lean();

      if (!plan)
        return throwError(
          returnMessage("payment", "planNotFound"),
          statusCode.notFound
        );

      if (plan?.plan_type === "unlimited") {
        return throwError(returnMessage("payment", "canNotDoOneTimePayment"));
        const sheets = await SheetManagement.findOne({
          user_id: user?._id,
          is_deleted: false,
        }).lean();

        // this is used if the users has selected unlimited plan wants to add the user even after the occupied
        if (sheets.occupied_sheets + 1 + 1 > plan?.seat)
          return throwError(returnMessage("payment", "maxSheetsAllocated"));
      }

      const subscripion_detail = await this.subscripionDetail(
        user?.subscription_id
      );

      let prorate_value;

      if (
        !subscripion_detail?.current_start &&
        !subscripion_detail?.current_end
      ) {
        let start = moment().startOf("day");
        const current_month_days = moment().daysInMonth();
        const end = moment.unix(subscripion_detail?.charge_at).startOf("day");
        const days_diff = Math.abs(moment.duration(end.diff(start)).asDays());
        prorate_value = parseInt(
          ((plan?.amount / current_month_days) * days_diff).toFixed(2)
        );
      } else if (user?.workspace_detail?.pause_subscription_date) {
        const start_date = moment().startOf("day");
        const end_date = moment(
          user?.workspace_detail?.pause_subscription_date
        ).endOf("day");

        const start_unix = start_date.unix();
        const end_unix = end_date.unix();
        prorate_value = parseInt(
          this.customPaymentCalculator(start_unix, end_unix, plan)
        );
      } else {
        prorate_value = parseInt(
          this.customPaymentCalculator(
            subscripion_detail?.current_start,
            subscripion_detail?.current_end,
            plan
          )
        );
      }

      // removing the by default package and using the axios call instead of the npm package
      // const order = await Promise.resolve(
      //   razorpay.orders.create({
      //     amount: prorate_value,
      //     currency: "INR",
      //     receipt: Date.now().toString(),
      //   })
      // );
      return razorpay.orders
        .create({
          amount: prorate_value,
          currency: plan?.currency,
          receipt: Date.now().toString(),
        })
        .then(async (order) => {
          await Order_Management.create({
            order_id: order?.id,
            amount: prorate_value,
            currency: plan?.currency,
            member_id: payload?.user_id,
            agency_id: user?._id,
            email: user?.email,
            contact_number: user?.contact_number,
            workspace_id: user?.workspace_detail?._id,
            plan_id: plan?.plan_id,
          });

          return {
            payment_id: order?.id,
            amount: prorate_value,
            currency: plan?.currency,
            user_id: payload?.user_id,
            agency_id: user?._id,
            email: user?.email,
            contact_number: user?.contact_number,
            workspace: user?.workspace_detail?._id,
          };
        })
        .catch((error) => {
          logger.error(`Error while generating one time payment: ${error}`),
            console.log(error, "Error with order payment");
        });
    } catch (error) {
      console.log(JSON.stringify(error));

      logger.error(`Error while doing the one time payment: ${error}`);
      return throwError(
        error?.message || error?.error?.description,
        error?.statusCode
      );
    }
  };

  verifySignature = async (payload, user) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
        payload;

      const expected_signature_1 = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(razorpay_payment_id + "|" + razorpay_order_id, "utf-8")
        .digest("hex");
      const expected_signature_2 = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id, "utf-8")
        .digest("hex");

      if (
        expected_signature_1 === razorpay_signature ||
        expected_signature_2 === razorpay_signature
      ) {
        const status_change = await this.statusChange(payload, user);
        // if (!status_change.success) return { success: false };

        // ---------------------- Notification ----------------------

        const [userData, agencyData, workspace] = await Promise.all([
          Authentication.findById(payload?.user_id).lean(),
          Authentication.findById(payload?.agency_id).lean(),
          Workspace.findById(payload?.workspace)
            .populate("members.role")
            .lean(),
        ]);

        if (userData && payload.agency_id) {
          const member_detail = workspace?.members?.find(
            (member) =>
              member?.user_id?.toString() === payload?.user_id?.toString()
          );
          notificationService.addNotification({
            receiver_id: payload?.agency_id,
            agency_name:
              capitalizeFirstLetter(agencyData?.first_name) +
              " " +
              capitalizeFirstLetter(agencyData?.last_name),
            module_name: "payment",
            action_name: member_detail?.role?.name,
            user_name:
              capitalizeFirstLetter(userData?.first_name) +
              " " +
              capitalizeFirstLetter(userData?.last_name),
            amount: payload?.amount,
            currency: payload?.currency,
            workspace_id: payload?.workspace_id,
          });
          notificationService.addAdminNotification({
            receiver_id: payload?.agency_id,
            agency_name:
              capitalizeFirstLetter(agencyData?.first_name) +
              " " +
              capitalizeFirstLetter(agencyData?.last_name),
            module_name: "payment",
            action_name: member_detail?.role?.name,
            user_name:
              capitalizeFirstLetter(userData?.first_name) +
              " " +
              capitalizeFirstLetter(userData?.last_name),
            amount: payload?.amount,
            currency: payload?.currency,
            workspace_id: payload?.workspace_id,
          });
        }

        if (payload.agency_id) {
          notificationService.addAdminNotification({
            receiver_id: payload?.agency_id,
            action_name: "agency",
            module_name: "payment",
            amount: payload?.amount,
            currency: payload?.currency,
            user_name:
              capitalizeFirstLetter(agencyData?.first_name) +
              " " +
              capitalizeFirstLetter(agencyData?.last_name),
            workspace_id: payload?.workspace_id,
          });
        }

        // ---------------------- Notification ----------------------

        return {
          success: true,
          data: status_change?.data,
        };
      }

      return { success: false };
    } catch (error) {
      console.log(JSON.stringify(error));

      logger.error(`Error while verifying signature: ${error}`);
      return throwError(
        error?.message || error?.error?.description,
        error?.statusCode
      );
    }
  };

  // this function is used to check the agency is exist when doing the custompayment(single payment)
  checkAgencyExist = (user_id, agency) => {
    try {
      const user_exist = agency?.workspace_detail?.members?.find(
        (member) =>
          member?.user_id?.toString() === user_id?.toString() &&
          member?.status === "payment_pending"
      );

      if (!user_exist) return false;

      return true;
    } catch (error) {
      console.log(JSON.stringify(error));

      logger.error(`Error while checking agency exist: ${error}`);
      return false;
    }
  };

  // create the payemnt history and change the status based on that
  statusChange = async (payload, user) => {
    try {
      const {
        agency_id,
        user_id,
        amount,
        subscription_id,
        razorpay_order_id,
        currency,
        razorpay_payment_id,
        workspace_id,
      } = payload;
      if (payload?.agency_id && !payload?.user_id) {
        const updated_agency_detail = await Authentication.findByIdAndUpdate(
          agency_id,
          { subscribe_date: moment().format("YYYY-MM-DD").toString() },
          { new: true }
        );

        // commenting to create the payment history by the webhook
        // await PaymentHistory.create({
        //   agency_id,
        //   amount,
        //   subscription_id,
        //   currency,
        //   payment_id: razorpay_payment_id,
        // });

        await Workspace.findOneAndUpdate(
          { _id: workspace_id, "members.user_id": agency_id },
          { $set: { "members.$.status": "confirmed" } }
        );
        const [
          sheets,
          order_management,
          configuration,
          is_free_trial_completed,
        ] = await Promise.all([
          SheetManagement.findOne({
            user_id: agency_id,
            is_deleted: false,
          }).lean(),
          Order_Management.findOne({ subscription_id }).lean(),
          Configuration.findOne().lean(),
          PaymentHistory.findOne({
            payment_mode: "free_trial",
            agency_id: user?._id,
            is_deleted: false,
          }).lean(),
        ]);

        // this is used when user do the payment after creating the workspace so long time
        if (
          configuration?.payment?.free_trial > 0 &&
          !is_free_trial_completed
        ) {
          await Workspace.findByIdAndUpdate(workspace_id, {
            $set: {
              trial_end_date: moment
                .utc()
                .startOf("day")
                .add(configuration?.payment?.free_trial, "days"),
            },
          });
        }

        if (order_management) {
          const payment_obj = {
            agency_id,
            amount,
            subscription_id,
            currency,
            payment_id: razorpay_payment_id,
            plan_id: order_management?.plan_id,
            quantity: 1,
            workspace_id: order_management?.workspace_id,
          };

          if (configuration?.payment?.free_trial > 0) {
            payment_obj["payment_mode"] = "free_trial";
            payment_obj.amount = undefined;
            payment_obj.currency = undefined;
          }
          if (is_free_trial_completed) {
            delete payment_obj["payment_mode"];
          }

          await PaymentHistory.create(payment_obj);

          const plan_detail = await SubscriptionPlan.findOne({
            plan_id: order_management?.plan_id,
          }).lean();
          if (plan_detail?.plan_type === "unlimited") {
            await SheetManagement.findOneAndUpdate(
              { user_id: agency_id },
              { total_sheets: plan_detail?.seat },
              { upsert: true }
            );
          }
        }

        if (!sheets && order_management) {
          const plan_detail = await SubscriptionPlan.findOne(
            order_management?.plan_id
          ).lean();
          await SheetManagement.findOneAndUpdate(
            { user_id: agency_id },
            {
              user_id: agency_id,
              total_sheets:
                plan_detail?.plan_type === "unlimited" ? plan_detail?.seat : 1,
              occupied_sheets: [],
            },
            { upsert: true }
          );
        }
        // updated_agency_detail = updated_agency_detail.toJSON();
        delete updated_agency_detail?.password;
        delete updated_agency_detail?.is_google_signup;
        delete updated_agency_detail?.is_facebook_signup;
        delete updated_agency_detail?.subscription_id;

        await Order_Management.findOneAndUpdate(
          { subscription_id },
          { is_deleted: true }
        );
        return {
          success: true,
          message: returnMessage("payment", "paymentCompleted"),
          data: { user: updated_agency_detail },
        };
      } else if (payload?.agency_id && payload?.user_id) {
        const [
          agency_details,
          user_details,
          sheets,
          workspace_exist,
          configuration,
          order_exist,
        ] = await Promise.all([
          Authentication.findById(agency_id).lean(),
          Authentication.findById(payload?.user_id).lean(),
          SheetManagement.findOne({
            user_id: agency_id,
            is_deleted: false,
          }).lean(),
          Workspace.findById(workspace_id).lean(),
          Configuration.findOne().lean(),
          Order_Management.findOne({
            order_id: razorpay_order_id,
            is_deleted: false,
          }).lean(),
        ]);
        if (!order_exist) return { success: true };
        const member_detail = workspace_exist?.members?.find(
          (member) =>
            member?.user_id?.toString() === user_details?._id?.toString()
        );

        let invitation_token = crypto.randomBytes(16).toString("hex");
        const link = `${process.env.REACT_APP_URL}/verify?workspace=${
          workspace_exist?._id
        }&email=${encodeURIComponent(
          user_details?.email
        )}&token=${invitation_token}&workspace_name=${
          workspace_exist?.name
        }&first_name=${user_details?.first_name}&last_name=${
          user_details?.last_name
        }`;

        const email_template = templateMaker("teamInvitation.html", {
          REACT_APP_URL: process.env.REACT_APP_URL,
          SERVER_URL: process.env.SERVER_URL,
          username:
            capitalizeFirstLetter(user_details?.first_name) +
            " " +
            capitalizeFirstLetter(user_details?.last_name),
          invitation_text: `You are invited to the ${capitalizeFirstLetter(
            workspace_exist?.name
          )} workspace by ${
            capitalizeFirstLetter(agency_details?.first_name) +
            " " +
            capitalizeFirstLetter(agency_details?.last_name)
          }. Click on the below link to join the workspace.`,
          link: link,
          instagram: configuration?.urls?.instagram,
          facebook: configuration?.urls?.facebook,
          privacy_policy: configuration?.urls?.privacy_policy,
        });

        sendEmail({
          email: user_details?.email,
          subject: returnMessage("auth", "invitationEmailSubject"),
          message: email_template,
        });

        await PaymentHistory.create({
          agency_id,
          member_id: user_details?._id,
          amount,
          order_id: razorpay_order_id,
          currency,
          role: member_detail?.role,
          payment_id: razorpay_payment_id,
        });
        await Workspace.findOneAndUpdate(
          {
            _id: workspace_exist?._id,
            "members.user_id": payload?.user_id,
          },
          {
            $set: {
              "members.$.status": "confirm_pending",
              "mwmbers.$.invitation_token": invitation_token,
            },
          }
        );
        await Order_Management.findOneAndUpdate(
          { order_id: razorpay_order_id },
          { is_deleted: true }
        );
        await this.updateSubscription(agency_id, sheets?.total_sheets);

        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.log(JSON.stringify(error));

      logger.error(`Error while changing status after the payment: ${error}`);
      return false;
    }
  };

  // fetch subscription by id
  subscripionDetail = async (subscription_id) => {
    try {
      // commented because of the taking more time in the staging server
      /* const { data } = await this.razorpayApi.get(
        `/subscriptions/${subscription_id}`
      );
      return data; */

      return razorpay.subscriptions
        .fetch(subscription_id)
        .then((data) => {
          console.log(data, "subscription detail fetch");
          return data;
        })
        .catch((error) => {
          logger.error(`Error while getting subscription detail: ${error}`);
          console.log("error while subscription detail", error);
        });
    } catch (error) {
      console.log(JSON.stringify(error));

      logger.error(`Error while gettign subscription detail: ${error}`);
      return false;
    }
  };

  // update subscription whenever new sheet is addded or done the payment
  updateSubscription = async (agency_id, quantity) => {
    try {
      const agency = await Authentication.findById(agency_id).lean();
      if (!agency) return;

      razorpay.subscriptions
        .update(agency?.subscription_id, {
          quantity,
        })
        .then((data) => {
          console.log("subscription updated:");
        })
        .catch((error) => {
          logger.error(`Error while updating subscription: ${error}`);
          console.log("error with update subscription", error);
        });

      // commmenting to apply the razorpay axios api
      // await this.razorpayApi.patch(
      //   `/subscriptions/${agency?.subscription_id}`,
      //   {
      //     quantity,
      //   }
      // );
      return;
    } catch (error) {
      console.log(JSON.stringify(error));
      logger.error(`Error while updating the subscription: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // fetch the payment history for the agency only
  paymentHistory = async (payload, user) => {
    try {
      const pagination = paginationObject(payload);

      let search_obj = {};
      if (payload?.search && payload?.search !== "") {
        search_obj["$or"] = [
          {
            payment_mode: {
              $regex: payload.search.toLowerCase(),
              $options: "i",
            },
          },
        ];

        const keywordType = getKeywordType(payload.search);

        if (keywordType === "date") {
          const dateKeyword = new Date(payload.search);
          search_obj["$or"].push({ createdAt: dateKeyword });
        }
        if (keywordType === "number") {
          const number = parseInt(payload.search);
          search_obj["$or"].push({ amount: number });
        }
      }

      const [payment_history, total_history] = await Promise.all([
        PaymentHistory.find({
          agency_id: user?._id,
          workspace_id: user?.workspace,
          ...search_obj,
        })
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page)
          .lean(),
        PaymentHistory.countDocuments({
          workspace_id: user?.workspace,
          agency_id: user?._id,
          ...search_obj,
        }),
      ]);

      return {
        payment_history,
        page_count: Math.ceil(total_history / pagination.result_per_page) || 0,
      };
    } catch (error) {
      logger.error(`Error while getting the payment history: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // fetch the sheets lists and who is assined to the particular sheet
  sheetsListing = async (payload, user) => {
    try {
      const pagination = paginationObject(payload);

      // aggragate reference from the https://mongoplayground.net/p/TqFafFxrncM

      const aggregate = [
        { $match: { user_id: user?._id, is_deleted: false } },
        {
          $unwind: {
            path: "$occupied_sheets",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "authentications", // The collection name of the users
            localField: "occupied_sheets.user_id",
            foreignField: "_id",
            as: "user",
            pipeline: [
              {
                $project: {
                  first_name: 1,
                  last_name: 1,
                  name: { $concat: ["$first_name", " ", "$last_name"] },
                  _id: 1,
                },
              },
            ],
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } }, // Unwind the user details array
        {
          $lookup: {
            from: "role_masters", // The collection name of the sub_roles
            localField: "occupied_sheets.role",
            foreignField: "_id",
            as: "role",
          },
        },
        {
          $unwind: {
            path: "$role",
            preserveNullAndEmptyArrays: true,
          },
        }, // Unwind the sub_role details array
        {
          $project: {
            _id: 0,
            user: "$user",
            _id: "$user._id",
            first_name: "$user.first_name",
            last_name: "$user.last_name",
            role: "$role.name",
            name: "$user.name",
            total_sheets: 1,
          },
        },
        {
          $group: {
            _id: null,
            items: {
              $push: {
                user: "$user",
                first_name: "$first_name",
                last_name: "$last_name",
                name: "$name",
                role: "$role",
                user_id: "$_id",
              },
            },
            total_sheets: { $first: "$total_sheets" },
          },
        },
        {
          $project: {
            _id: 0,
            items: 1,
            total_sheets: 1,
          },
        },
      ];

      const sheets = await SheetManagement.aggregate(aggregate);

      const occupied_sheets = sheets[0];

      occupied_sheets?.items?.unshift({
        name:
          capitalizeFirstLetter(user?.first_name) +
          " " +
          capitalizeFirstLetter(user?.last_name),
        first_name: user?.first_name,
        last_name: user?.last_name,
        role: "agency",
      });

      occupied_sheets.items = occupied_sheets?.items?.filter(
        (item) => Object.keys(item)?.length !== 0
      );

      for (let i = 0; i < occupied_sheets.total_sheets; i++) {
        if (occupied_sheets?.items[i]) {
          occupied_sheets.items[i] = {
            ...occupied_sheets.items[i],
            seat_no: (i + 1).toString(),
            status: "Allocated",
          };
        } else {
          occupied_sheets.items[i] = {
            seat_no: (i + 1).toString(),
            status: "Available",
          };
        }
      }

      if (payload?.search && payload?.search !== "") {
        // Create a regex pattern based on the query
        const regex = new RegExp(
          payload?.search?.toLowerCase().split(/\s+/).join(".*")
        );
        occupied_sheets.items = occupied_sheets?.items?.filter((item) => {
          return (
            regex.test(item?.first_name?.toLowerCase()) ||
            regex.test(item?.last_name?.toLowerCase()) ||
            regex.test(item?.name?.toLowerCase()) ||
            regex.test(item?.role?.toLowerCase()) ||
            regex.test(item?.status?.toLowerCase()) ||
            regex.test(item?.seat_no)
          );
        });
      }

      if (payload?.sort_field && payload?.sort_field !== "") {
        // Sort the results based on the name
        occupied_sheets?.items?.sort((a, b) => {
          let nameA, nameB;
          if (payload?.sort_field === "name") {
            nameA = a?.name?.toLowerCase();
            nameB = b?.name?.toLowerCase();
          } else if (payload?.sort_field === "role") {
            nameA = a?.role?.toLowerCase();
            nameB = b?.role?.toLowerCase();
          } else if (payload?.sort_field === "status") {
            nameA = a?.status?.toLowerCase();
            nameB = b?.status?.toLowerCase();
          } else if (payload?.sort_field === "seat_no") {
            nameA = a?.seat_no;
            nameB = b?.seat_no;
          }

          if (payload?.sort_order === "asc") {
            return nameA?.localeCompare(nameB);
          } else {
            return nameB?.localeCompare(nameA);
          }
        });
      }

      const page = pagination.page;
      const pageSize = pagination?.result_per_page;

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      return {
        sheets: occupied_sheets?.items?.slice(startIndex, endIndex),
        total_sheets: occupied_sheets?.total_sheets,
        page_count:
          Math.ceil(
            occupied_sheets?.items?.length / pagination.result_per_page
          ) || 0,
      };
    } catch (error) {
      logger.error(`Error while fetching the sheets listing: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  removeUser = async (payload, user) => {
    try {
      const { user_id } = payload;
      if (
        user?.workspace_detail?.created_by?.toString() !== user?._id?.toString()
      )
        return throwError(
          returnMessage("auth", "forbidden"),
          statusCode.forbidden
        );

      const [sheets, plan] = await Promise.all([
        SheetManagement.findOne({
          user_id: user?._id,
          is_deleted: false,
        }).lean(),
        SubscriptionPlan.findById(user?.purchased_plan).lean(),
      ]);

      if (!sheets)
        return throwError(
          returnMessage("payment", "sheetsNotAvailable"),
          statusCode.notFound
        );

      const user_exist = sheets?.occupied_sheets?.filter(
        (sheet) => sheet?.user_id?.toString() === user_id
      );

      if (user_exist.length === 0)
        return throwError(
          returnMessage("auth", "userNotFound"),
          statusCode.notFound
        );

      const updated_users = sheets?.occupied_sheets?.filter(
        (sheet) => sheet?.user_id?.toString() !== user_id
      );

      // notification module is pending to work
      /* // ---------------- Notification ----------------
      const remove_user = user_exist[0];
      const removeUserData = await Authentication.findOne({
        reference_id: remove_user.user_id,
      }).lean();
      let roleName;
      if (remove_user.role === "client") roleName = "client";
      if (remove_user.role === "team_agency") roleName = "Team Agency";
      if (remove_user.role === "team_client") roleName = "Team Client";
      await notificationService.addAdminNotification({
        action_name: "seatRemoved",
        user_type: roleName,
        removed_user:
          removeUserData.first_name + " " + removeUserData.last_name,
        agency_name: user.first_name + " " + user.last_name,
        user_type: roleName,
        ...removeUserData,
      });

      const admin = await Admin.findOne({});

      const seatTemplate = seatRemoved({
        ...removeUserData,
        removed_user:
          removeUserData.first_name + " " + removeUserData.last_name,
        agency_name: user.first_name + " " + user.last_name,
        user_type: roleName,
      });
      sendEmail({
        email: admin?.email,
        subject: returnMessage("emailTemplate", "seatRemoved"),
        message: seatTemplate,
      });
      // ---------------- Notification ---------------- */

      // this will used to check weather this user id has assined any task and it is in the pending state
      let task_assigned = await Task.aggregate([
        {
          $match: {
            workspace_id: user?.workspace_detail?._id,
            assign_to: { $in: [user_id] },
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: "sections",
            localField: "activity_status",
            foreignField: "_id",
            as: "activity_status",
          },
        },
        {
          $unwind: {
            path: "$activity_status",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "boards",
            localField: "board_id",
            foreignField: "_id",
            as: "board_data",
            pipeline: [{ $project: { board_status: 1, is_deleted: 1 } }],
          },
        },
        {
          $unwind: { path: "$board_data", preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            $and: [
              { "activity_status.key": { $ne: "completed" } },
              { "activity_status.key": { $ne: "archived" } },
            ],
            "board_data.is_deleted": false,
          },
        },
      ]);

      if (task_assigned.length && !payload?.force_fully_remove)
        return { force_fully_remove: true };

      if (
        (task_assigned.length && payload?.force_fully_remove) ||
        !task_assigned.length
      ) {
        const update_obj = { occupied_sheets: updated_users };
        if (user?.workspace_detail?.trial_end_date) {
          update_obj.total_sheets = sheets?.total_sheets - 1;
        }
        if (plan?.plan_type === "limited")
          this.updateSubscription(user?._id, update_obj.total_sheets);
        else if (plan?.plan_type === "unlimited")
          update_obj.total_sheets = plan?.seat;

        await SheetManagement.findByIdAndUpdate(sheets._id, update_obj);
        await Workspace.findOneAndUpdate(
          { _id: user?.workspace, "members.user_id": user_id },
          {
            $set: {
              "members.$.status": "deleted",
              "members.$.invitation_token": null,
            },
          }
        );
      }
      return;
    } catch (error) {
      logger.error(`Error while removing the user from the sheet: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  cancelSubscription = async (user) => {
    try {
      const [sheets, plan] = await Promise.all([
        SheetManagement.findOne({
          user_id: user?._id,
          is_deleted: false,
        }).lean(),
        SubscriptionPlan.findById(user?.purchased_plan).lean(),
      ]);

      if (sheets.total_sheets === 1 || plan?.plan_type === "unlimited")
        return throwError(returnMessage("payment", "canNotCancelSubscription"));

      if (!(sheets.occupied_sheets.length >= 0))
        return throwError(returnMessage("payment", "canNotCancel"));

      const updated_sheet = await SheetManagement.findByIdAndUpdate(
        sheets?._id,
        { total_sheets: sheets?.total_sheets - 1 },
        { new: true }
      ).lean();

      // removed the razorpay package code
      // await Promise.resolve(
      //   razorpay.subscriptions.update(user?.subscription_id, {
      //     quantity: updated_sheet?.total_sheets,
      //   })
      // );

      if (!user?.workspace_detail?.trial_end_date && user?.subscription_id) {
        razorpay.subscriptions
          .update(user?.subscription_id, {
            quantity: updated_sheet?.total_sheets,
          })
          .then((data) => {
            console.log("subscription updated");
          })
          .catch((error) => {
            logger.error(`Error while updating subscription: ${error}`);
            console.log(`Error with subscription update`, error);
          });

        /* await this.razorpayApi.patch(
          `/subscriptions/${user?.subscription_id}`,
          {
            quantity: updated_sheet?.total_sheets,
          }
        ); */
      }

      return;
    } catch (error) {
      console.log(JSON.stringify(error));
      logger.error(`Error while canceling the subscription: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  getSubscription = async (agency) => {
    try {
      let subscription, plan_details;
      const agency_detail = memberDetail(agency);

      if (agency?.subscribe_date && agency?.subscription_id) {
        [subscription, plan_details] = await Promise.all([
          this.subscripionDetail(agency?.subscription_id),
          SubscriptionPlan.findById(agency?.purchased_plan).lean(),
        ]);
      }

      const [sheets_detail, earned_total] = await Promise.all([
        SheetManagement.findOne({
          user_id: agency?._id,
          is_deleted: false,
        }).lean(),
        this.calculateTotalReferralPoints(agency),
      ]);

      if (agency?.subscription_halted) {
        await Authentication.findByIdAndUpdate(agency?._id, {
          subscription_halted_displayed: true,
        });
      }

      return {
        next_billing_date:
          subscription?.current_end || agency?.workspace_detail?.trial_end_date,
        next_billing_price:
          subscription?.quantity * (plan_details?.amount / 100) ||
          plan_details?.amount / 100,
        total_sheets: sheets_detail?.total_sheets,
        available_sheets: Math.abs(
          sheets_detail?.total_sheets -
            1 -
            sheets_detail?.occupied_sheets?.length
        ),
        subscription,
        referral_points: {
          erned_points: earned_total,
          available_points: agency_detail?.gamification_points || 0,
        },
      };
    } catch (error) {
      logger.error(`Error while getting the referral: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
  /* Need to work on the referral points later */
  calculateTotalReferralPoints = async (agency) => {
    try {
      const total_earned_point = await Gamification.find({
        user_id: agency?._id,
        workspace_id: agency?.workspace,
      }).lean();
      return total_earned_point.reduce((acc, curr) => {
        return acc + Math.abs(parseInt(curr.point));
      }, 0);
    } catch (error) {
      throw error;
    }
  };

  planDetails = (plan_id) => {
    try {
      // const { data } = await this.razorpayApi.get(`/plans/${plan_id}`);
      // return data;

      return razorpay.plans
        .fetch(plan_id)
        .then((plan) => {
          return plan;
        })
        .catch((error) => {
          logger.error(`Error while getting plan details: ${error}`);
          console.log(error);
        });
    } catch (error) {
      console.log(JSON.stringify(error));
      logger.error(
        `Error while getting the plan details from the razorpay: ${error}`
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  planDetailsAxios = async (plan_id) => {
    try {
      const response = await axios.get(
        `https://api.razorpay.com/v1/plans/${plan_id}`,
        {
          auth: {
            username: "rzp_test_lGt50R6T1BIUBR",
            password: "TI8QOrNF6L6Qft2U9CZ5JyLq",
          },
        }
      );
      return response?.data;
    } catch (error) {
      logger.error(
        `Error while getting the plan details from the razorpay: ${error}`
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  paymentDetails = async (payment_id) => {
    try {
      return razorpay.payments
        .fetch(payment_id)
        .then((data) => {
          return data;
        })
        .catch((error) => {
          logger.error(
            `Error while getting the plan details from the razorpay: ${error}`
          );
          console.log(error);
        });
    } catch (error) {
      logger.error(
        `Error while getting the plan details from the razorpay: ${error}`
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  referralPay = async (payload, user) => {
    try {
      // removed as this has no meaning at all
      /*  if (payload?.without_referral === true) {
        return await this.withoutReferralPay(payload, user);
      } */

      const member_detail = memberDetail(user);

      const configuration = await Configuration.findOne().lean();
      if (
        !(
          member_detail?.gamification_points >=
          configuration?.referral?.redeem_required_point
        )
      )
        return throwError(
          returnMessage("referral", "insufficientReferralPoints")
        );

      payload.redeem_required_point =
        configuration?.referral?.redeem_required_point;
      const status_change = await this.referralStatusChange(payload, user);
      if (!status_change.success) return { success: false };

      await Workspace.findOneAndUpdate(
        { _id: user?.workspace, "members.user_id": payload?.user_id },
        { $set: { "members.$.status": "confirm_pending" } }
      );

      await Workspace.findOneAndUpdate(
        { _id: user?.workspace, "members.user_id": user?._id },
        {
          $inc: {
            "members.$.gamification_points":
              -configuration?.referral?.redeem_required_point,
          },
        }
      );
      return { success: true, message: status_change?.message };
    } catch (error) {
      logger.error(`Error while verifying referral: ${error}`);
      return throwError(
        error?.message || error?.error?.description,
        error?.statusCode
      );
    }
  };

  referralStatusChange = async (payload, user) => {
    try {
      const { user_id, redeem_required_point } = payload;
      const agency_details = user;

      const new_member_detail = user?.workspace_detail?.members?.find(
        (member) =>
          member?.user_id?.toString() === user_id?.toString() &&
          member?.status === "payment_pending"
      );
      if (!new_member_detail) return { success: false };
      if (payload?.user_id) {
        const [
          user_details,
          sheets,
          configuration,
          role,
          workspace_exist,
          plan,
        ] = await Promise.all([
          Authentication.findById(user_id).lean(),
          SheetManagement.findOne({
            user_id: user?._id,
            is_deleted: false,
          }).lean(),
          Configuration.findOne().lean(),
          Role_Master.findById(new_member_detail?.role).lean(),
          Workspace.findById(user?.workspace).lean(),
          SubscriptionPlan.findById(user?.purchased_plan).lean(),
        ]);

        if (!sheets || plan?.plan_type === "unlimited")
          return { success: false };

        let invitation_token = crypto.randomBytes(16).toString("hex");
        const link = `${process.env.REACT_APP_URL}/verify?workspace=${
          workspace_exist?._id
        }&email=${encodeURIComponent(
          user_details?.email
        )}&token=${invitation_token}&workspace_name=${
          workspace_exist?.name
        }&first_name=${user_details?.first_name}&last_name=${
          user_details?.last_name
        }`;

        const email_template = templateMaker("teamInvitation.html", {
          REACT_APP_URL: process.env.REACT_APP_URL,
          SERVER_URL: process.env.SERVER_URL,
          username:
            capitalizeFirstLetter(user_details?.first_name) +
            " " +
            capitalizeFirstLetter(user_details?.last_name),
          invitation_text: `You are invited to the ${capitalizeFirstLetter(
            workspace_exist?.name
          )} workspace by ${
            capitalizeFirstLetter(agency_details?.first_name) +
            " " +
            capitalizeFirstLetter(agency_details?.last_name)
          }. Click on the below link to join the workspace.`,
          link: link,
          instagram: configuration?.urls?.instagram,
          facebook: configuration?.urls?.facebook,
          privacy_policy: configuration?.urls?.privacy_policy,
        });

        sendEmail({
          email: user_details?.email,
          subject: returnMessage("auth", "invitationEmailSubject"),
          message: email_template,
        });

        await PaymentHistory.create({
          agency_id: agency_details?._id,
          member_id: user_details?._id,
          amount: redeem_required_point,
          role: role?.name,
          payment_mode: "referral",
          workspace_id: user?.workspace,
        });

        if (plan?.plan_type === "limited") {
          await this.updateSubscription(
            agency_details?._id,
            sheets?.total_sheets
          );
        }

        let message;
        if (role?.name === "client") {
          message = returnMessage("agency", "clientCreated");
        } else if (role?.name === "team_agency") {
          message = returnMessage("teamMember", "teamMemberCreated");
        } else if (role?.name === "team_client") {
          message = returnMessage("teamMember", "teamMemberCreated");
        }

        return { success: true, message };
      }
      return { success: false };
    } catch (error) {
      console.log(JSON.stringify(error));

      logger.error(`Error while changing status after the payment: ${error}`);
      return false;
    }
  };

  // this function is used to get the referral and available sheets
  paymentScopes = async (agency) => {
    try {
      const member_detail = agency?.workspace_detail?.members?.find(
        (member) =>
          member?.user_id?.toString() === agency?._id?.toString() &&
          member?.status === "confirmed"
      );

      const [plan, config, sheet, role] = await Promise.all([
        SubscriptionPlan.findById(agency?.purchased_plan).lean(),
        Configuration.findOne().lean(),
        SheetManagement.findOne({
          user_id: agency?._id,
          is_deleted: false,
        }).lean(),
        Role_Master.findById(member_detail?.role).lean(),
      ]);

      const subscription_detail = await this.subscripionDetail(
        agency?.subscription_id
      );
      if (role?.name !== "agency")
        return throwError(
          returnMessage("auth", "insufficientPermission"),
          statusCode.forbidden
        );

      let payable_amount;

      if (
        !subscription_detail?.current_start &&
        !subscription_detail?.current_end
      ) {
        let start = moment().startOf("day");
        const current_month_days = moment().daysInMonth();
        const end = moment.unix(subscription_detail?.charge_at).startOf("day");
        const days_diff = Math.abs(moment.duration(end.diff(start)).asDays());
        payable_amount = (
          ((plan?.amount / current_month_days) * days_diff) /
          100
        ).toFixed(2);
      } else {
        payable_amount = (
          this.customPaymentCalculator(
            subscription_detail?.current_start,
            subscription_detail?.current_end,
            plan
          ) / 100
        ).toFixed(2);
      }
      const redirect_payment_page =
        member_detail?.gamification_points >=
        config?.referral?.redeem_required_point
          ? true
          : false;

      return {
        payable_amount: plan?.symbol + " " + payable_amount,
        referral_point: member_detail?.gamification_points,
        redeem_required_point: config?.referral?.redeem_required_point,
        redirect_payment_page,
        available_sheets:
          sheet?.total_sheets - sheet?.occupied_sheets?.length - 1,
        plan,
      };
    } catch (error) {
      logger.error(`Error while fetching referral statistics: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // this function is used for to add the team member or the client without redeeming the points and currency
  withoutReferralPay = async (payload, user) => {
    try {
      const { user_id } = payload;
      const agency_details = user;
      if (payload?.user_id) {
        const [user_details, sheets] = await Promise.all([
          Authentication.findOne({
            reference_id: payload?.user_id,
          })
            .populate("role", "name")
            .lean(),
          SheetManagement.findOne({
            user_id: user?._id,
            is_deleted: false,
          }).lean(),
        ]);

        if (
          !sheets ||
          !(sheets.total_sheets - sheets.occupied_sheets.length - 1 > 0)
        )
          return { success: false };

        if (user_details?.role?.name === "client") {
          let link = `${
            process.env.REACT_APP_URL
          }/client/verify?name=${encodeURIComponent(
            capitalizeFirstLetter(agency_details?.first_name) +
              " " +
              capitalizeFirstLetter(agency_details?.last_name)
          )}&email=${encodeURIComponent(
            user_details?.email
          )}&agency=${encodeURIComponent(agency_details?.reference_id)}`;

          const invitation_text = `${capitalizeFirstLetter(
            agency_details?.first_name
          )} ${capitalizeFirstLetter(
            agency_details?.last_name
          )} has sent an invitation to you. please click on below button to join Syncupp.`;
          const company_urls = await Configuration.find().lean();
          let privacy_policy = company_urls[0]?.urls?.privacy_policy;

          let facebook = company_urls[0]?.urls?.facebook;

          let instagram = company_urls[0]?.urls?.instagram;
          const invitation_mail = invitationEmail(
            link,
            capitalizeFirstLetter(user_details?.first_name) +
              " " +
              capitalizeFirstLetter(user_details?.last_name),
            invitation_text,
            privacy_policy,
            facebook,
            instagram
          );

          await sendEmail({
            email: user_details?.email,
            subject: returnMessage("emailTemplate", "invitation"),
            message: invitation_mail,
          });
          await Client.updateOne(
            {
              _id: user_id,
              "agency_ids.agency_id": agency_details?.reference_id,
            },
            { $set: { "agency_ids.$.status": "pending" } },
            { new: true }
          );
        } else if (user_details?.role?.name === "team_agency") {
          const link = `${process.env.REACT_APP_URL}/team/verify?agency=${
            capitalizeFirstLetter(agency_details?.first_name) +
            " " +
            capitalizeFirstLetter(agency_details?.last_name)
          }&agencyId=${agency_details?.reference_id}&email=${encodeURIComponent(
            user_details?.email
          )}&token=${user_details?.invitation_token}&redirect=false`;

          const invitation_text = `${capitalizeFirstLetter(
            agency_details?.first_name
          )} ${capitalizeFirstLetter(
            agency_details?.last_name
          )} has sent an invitation to you. please click on below button to join Syncupp.`;
          const company_urls = await Configuration.find().lean();
          let privacy_policy = company_urls[0]?.urls?.privacy_policy;

          let facebook = company_urls[0]?.urls?.facebook;

          let instagram = company_urls[0]?.urls?.instagram;
          const invitation_template = invitationEmail(
            link,
            capitalizeFirstLetter(user_details?.first_name) +
              " " +
              capitalizeFirstLetter(user_details?.last_name),
            invitation_text,
            privacy_policy,
            facebook,
            instagram
          );

          await Authentication.findByIdAndUpdate(
            user_details?._id,
            { status: "confirm_pending" },
            { new: true }
          );

          await sendEmail({
            email: user_details?.email,
            subject: returnMessage("emailTemplate", "invitation"),
            message: invitation_template,
          });
        } else if (user_details?.role?.name === "team_client") {
          const team_client_detail = await Team_Client.findById(
            user_details.reference_id
          ).lean();

          const link = `${process.env.REACT_APP_URL}/team/verify?agency=${
            capitalizeFirstLetter(agency_details?.first_name) +
            " " +
            capitalizeFirstLetter(agency_details?.last_name)
          }&agencyId=${agency_details?.reference_id}&email=${encodeURIComponent(
            user_details?.email
          )}&clientId=${team_client_detail.client_id}`;
          const invitation_text = `${capitalizeFirstLetter(
            agency_details?.first_name
          )} ${capitalizeFirstLetter(
            agency_details?.last_name
          )} has sent an invitation to you. please click on below button to join Syncupp.`;
          const company_urls = await Configuration.find().lean();
          let privacy_policy = company_urls[0]?.urls?.privacy_policy;

          let facebook = company_urls[0]?.urls?.facebook;

          let instagram = company_urls[0]?.urls?.instagram;
          const invitation_template = invitationEmail(
            link,
            capitalizeFirstLetter(user_details?.first_name) +
              " " +
              capitalizeFirstLetter(user_details?.last_name),
            invitation_text,
            privacy_policy,
            facebook,
            instagram
          );

          await sendEmail({
            email: user_details?.email,
            subject: returnMessage("emailTemplate", "invitation"),
            message: invitation_template,
          });

          await Team_Client.updateOne(
            {
              _id: user_id,
              "agency_ids.agency_id": agency_details?.reference_id,
            },
            { $set: { "agency_ids.$.status": "pending" } },
            { new: true }
          );
        }

        const occupied_sheets = [
          ...sheets.occupied_sheets,
          {
            user_id,
            role: user_details?.role?.name,
          },
        ];

        await SheetManagement.findByIdAndUpdate(sheets._id, {
          occupied_sheets,
        });

        let message;
        if (user_details?.role?.name === "client") {
          message = returnMessage("agency", "clientCreated");
        } else if (user_details?.role?.name === "team_agency") {
          message = returnMessage("teamMember", "teamMemberCreated");
        } else if (user_details?.role?.name === "team_client") {
          message = returnMessage("teamMember", "teamMemberCreated");
        }

        return { success: true, message };
      }
      return { success: false };
    } catch (error) {
      console.log(JSON.stringify(error));
      logger.error(`Error while changing status after the payment: ${error}`);
      return { success: false };
    }
  };

  // this function is used to get the invoice details from the subscription id
  invoices = async (subscription_id) => {
    try {
      /*  const { data } = await this.razorpayApi.get(
        `/invoices?subscription_id=${subscription_id}`
      );
      return data; */
      return razorpay.invoices
        .all({ subscription_id })
        .then((data) => {
          return data;
        })
        .catch((error) => {
          logger.error(
            `Error while getting the invoices from the Subscription id :${error} `
          );
          console.log(error);
        });
    } catch (error) {
      logger.error(
        `Error while getting the invoices from the Subscription id :${error} `
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  // this function is used to get the payment details from the Order id
  // and the order id is generate based on the agency doing single payment
  orderPaymentDetails = async (order_id) => {
    try {
      /* const { data } = await this.razorpayApi.get(
        `/orders/${order_id}/payments`
      );
      return data; */
      // removed the npm package code
      return razorpay.orders
        .fetchPayments(order_id)
        .then((data) => {
          return data;
        })
        .catch((error) => {
          logger.error(
            `Error while getting the payment details from the order id :${error} `
          );
          console.log(error);
        });
    } catch (error) {
      logger.error(
        `Error while getting the payment details from the order id :${error} `
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  // this function is used to get the subscription details from the subscription id
  getSubscriptionDetail = async (subscription_id) => {
    try {
      /*    const { data } = await this.razorpayApi.get(
        `/subscriptions/${subscription_id}`
      );
      return data; */
      // removed the npm package code
      return razorpay.subscriptions
        .fetch(subscription_id)
        .then((data) => {
          return data;
        })
        .catch((error) => {
          logger.error(
            `Error while getting the invoices from the Subscription id :${error} `
          );
          console.log(error);
        });
    } catch (error) {
      logger.error(
        `Error while getting the invoices from the Subscription id :${error} `
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  couponPay = async (payload, user) => {
    try {
      const coupon = await AdminCoupon.findById(payload?.couponId).lean();
      if (!coupon) return returnMessage("payment", "CouponNotExist");

      const member_detail = user?.workspace_detail?.members?.find(
        (member) =>
          member?.user_id?.toString() === user?._id?.toString() &&
          member?.status === "confirmed"
      );

      const configuration = await Configuration.findOne().lean();

      if (
        !(
          member_detail?.gamification_points >=
          configuration?.coupon?.reedem_coupon
        )
      )
        return throwError(
          returnMessage("referral", "insufficientReferralPoints")
        );

      const updated_gamification_points = await Workspace.findOneAndUpdate(
        { _id: user?.workspace, "members.user_id": user?._id },
        {
          $inc: {
            "members.$.gamification_points":
              -configuration?.coupon?.reedem_coupon,
          },
          $push: { "members.$.total_coupon": coupon?._id },
        },
        { new: true }
      );

      if (updated_gamification_points) {
        await Gamification.create({
          user_id: user?._id,
          agency_id: user?.workspace_detail?.created_by,
          point: "-" + configuration?.coupon?.reedem_coupon.toString(),
          type: "coupon_purchase",
          role: member_detail?.role,
          workspace_id: user?.workspace,
          coupon_id: coupon?._id,
        });
      }

      return { success: true };
    } catch (error) {
      logger.error(`Error while verifying referral: ${error}`);
      return throwError(
        error?.message || error?.error?.description,
        error?.statusCode
      );
    }
  };

  deactivateAgency = async (agency, workspace_id) => {
    try {
      // this is specially used when admin wants to delete the user from the admin panel
      if (workspace_id) {
        agency = await Authentication.findById(agency).lean();
      }
      if (agency?.subscription_id) {
        const url = `https://api.razorpay.com/v1/subscriptions/${agency?.subscription_id}/cancel`;
        axios
          .post(
            url,
            { cancel_at_cycle_end: 0 },
            {
              headers: {
                Authorization: `Basic ${Buffer.from(
                  `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_SECRET}`
                ).toString("base64")}`,
                "Content-Type": "application/json", // Set the content type to JSON if needed
              },
            }
          )
          .then((response) => {
            console.log("Response:", response.data);
          })
          .catch((error) => {
            console.error("Error:", error);
            return throwError(returnMessage("default", "default"));
          });
        // removed because it was not working proper with default package
        /*  razorpay.subscriptions
          .cancel(agency?.subscription_id, {
            cancel_at_cycle_end: 0,
          })
          .then((data) => {
            console.log("Subscription cancelled successfully");
          })
          .catch((error) => {
            logger.error(`Error while deactivating the agency: ${error}`);
            console.log(error);
            return throwError(returnMessage("default", "default"));
          }); */
      }
      await this.deactivateAccount(agency, workspace_id);
      return;
    } catch (error) {
      logger.error(`Error while deactivating the agency: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // deactivate account for the agency and delete all connected users
  deactivateAccount = async (agency, workspace_id) => {
    try {
      if (workspace_id) agency.workspace = workspace_id;
      await Promise.all([
        Authentication.findByIdAndUpdate(agency?._id, {
          $unset: {
            subscribe_date: null,
            subscription_id: null,
            subscription_halted: null,
            subscription_halted_displayed: null,
          },
        }),
        Agreement.updateMany(
          {
            agency_id: agency?._id,
            workspace_id: agency?.workspace,
          },
          { $set: { is_deleted: true } }
        ),
        Invoice.updateMany(
          {
            agency_id: agency?._id,
            workspace_id: agency?.workspace,
          },
          { $set: { is_deleted: true } }
        ),
        Workspace.updateMany(
          { created_by: agency?._id, _id: agency?.workspace },
          { $set: { is_deleted: true } }
        ),
        SheetManagement.updateMany(
          { user_id: agency?._id },
          { $set: { is_deleted: true } }
        ),
        Task.updateMany(
          { workspace_id: agency?.workspace },
          { $set: { is_deleted: true } }
        ),
        this.glideCampaignContactDelete(agency?.glide_campaign_id),
      ]);
      return;
    } catch (error) {
      logger.error(
        `Error while deleting all of the users from the agency: ${error}`
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  // cron for the AGency to check subscription is expired or not and if it is expired with the given date then
  //  delete the user and do the cancel the subscription

  cronForSubscription = async () => {
    try {
      const [agencies, configuration] = await Promise.all([
        Authentication.find({
          subscription_id: { $exists: true },
          is_deleted: false,
        }).lean(),
        Configuration.findOne({}).lean(),
      ]);

      let privacy_policy = configuration?.urls?.privacy_policy;
      let facebook = configuration?.urls?.facebook;
      let instagram = configuration?.urls?.instagram;

      for (let i = 0; i < agencies.length; i++) {
        const subscription_detail = await this.subscripionDetail(
          agencies[i].subscription_id
        );
        if (
          (subscription_detail?.status === "pending" ||
            subscription_detail?.status === "halted") &&
          agencies[i].subscription_halted
        ) {
          const today = moment.utc().startOf("day");
          const subscription_halt_date = moment
            .utc(agencies[i].subscription_halted)
            .startOf("day");

          const days_diff = today.diff(subscription_halt_date, "days");

          if (days_diff > configuration?.payment?.subscription_halt_days) {
            await this.deactivateAgency(agencies[i]);
          }
        } else if (subscription_detail?.status === "active") {
          const renew_date = moment.unix(subscription_detail?.charge_at);
          const today = moment.utc();
          const days_diff = Math.abs(today.diff(renew_date, "days"));
          let notification_message = returnNotification(
            "payment",
            "nextSubscriptionStart"
          );

          let dayDifference = false;
          if (days_diff == 3) {
            notification_message = notification_message.replaceAll(
              "{{no_days}}",
              3
            );

            dayDifference = 3;
          } else if (days_diff === 1) {
            notification_message = notification_message.replaceAll(
              "{{no_days}}",
              1
            );
            dayDifference = 1;
          }

          if (dayDifference) {
            const workspace_detail = await Workspace.findOne({
              created_by: agencies[i]?._id,
            }).lean();

            const email_template = templateMaker("paymentAboutToExpire.html", {
              REACT_APP_URL: process.env.REACT_APP_URL,
              SERVER_URL: process.env.SERVER_URL,
              user_name:
                capitalizeFirstLetter(agencies[i].first_name) +
                " " +
                capitalizeFirstLetter(agencies[i].last_name),
              daycount: dayDifference,
              privacy_policy,
              instagram,
              facebook,
            });

            sendEmail({
              email: agencies[i]?.email,
              subject: returnMessage("emailTemplate", "planIsAboutExpired"),
              message: email_template,
            });

            const notification = await Notification.create({
              type: "payment",
              user_id: agencies[i]?._id,
              message: notification_message,
              workspace_id: workspace_detail?._id,
            });

            const pending_notification = await Notification.countDocuments({
              user_id: agencies[i]?._id,
              is_read: false,
              workspace_id: workspace_detail?._id,
            });

            eventEmitter(
              "NOTIFICATION",
              {
                notification,
                un_read_count: pending_notification,
              },
              agencies[i].reference_id,
              workspace_detail?._id
            );
          }
        }

        // removed as this is not used because we have added manual trial period
        /* if (subscription_detail?.status === "authenticated") {
          const renew_date = moment.unix(subscription_detail?.charge_at);
          const today = moment.utc();
          const days_diff = Math.abs(today.diff(renew_date, "days"));

          if (days_diff < 1) {
            let notification_message = returnNotification(
              "payment",
              "trialPeriodEnd"
            );
            notification_message = notification_message.replaceAll(
              "{{no_days}}",
              1
            );

            const notification = await Notification.create({
              type: "payment",
              user_id: agencies[i].reference_id,
              message: notification_message,
            });

            const pending_notification = await Notification.countDocuments({
              user_id: agencies[i].reference_id,
              is_read: false,
            });

            eventEmitter(
              "NOTIFICATION",
              {
                notification,
                un_read_count: pending_notification,
              },
              agencies[i].reference_id
            );

            let template = fs.readFileSync(
              `src/utils/freeTrialEnd.html`,
              "utf-8"
            );

            template = template.replaceAll(
              "{{server_url}}",
              process.env.SERVER_URL
            );
            template = template.replaceAll(
              "{{user_name}}",
              agencies[i].first_name + " " + agencies[i].last_name
            );

            await sendEmail({
              email: agencies[i]?.email,
              subject: returnMessage("emailTemplate", "freeTrialEndMail"),
              message: template,
            });
          }
        } */
      }
    } catch (error) {
      logger.error(
        `Error while running the cron of the subscription expire cron: ${error}`
      );
      console.log(error);
    }
  };

  cronForFreeTrialEnd = async () => {
    try {
      const [workspaces, configuration] = await Promise.all([
        Workspace.find({
          $and: [
            { trial_end_date: { $exists: true } },
            { trial_end_date: { $ne: null } },
          ],
          is_deleted: false,
        }).lean(),
        Configuration.findOne({}).lean(),
      ]);
      const today = moment.utc().startOf("day");

      workspaces.forEach(async (workspace) => {
        console.log(workspace?.name);
        if (!workspace?.trial_end_date) return;
        const trial_end_date = moment
          .utc(workspace?.trial_end_date)
          .subtract(2, "days") // substract 2 days because the trial end date contains the extra one day in date storing
          .startOf("day");
        console.log(trial_end_date, workspace?.name, "triela");
        const days_diff = trial_end_date.diff(today, "days");

        if (today.isSame(trial_end_date, "day")) {
          const user = await Authentication.findById(
            workspace?.created_by
          ).lean();

          let notification_message = returnNotification(
            "payment",
            "trialPeriodEnd"
          );
          notification_message = notification_message.replaceAll(
            "{{no_days}}",
            1
          );

          Notification.create({
            type: "payment",
            user_id: workspace.created_by,
            message: notification_message,
            workspace_id: workspace?._id,
          });

          const email_template = templateMaker("freeTrialEnd.html", {
            REACT_APP_URL: process.env.REACT_APP_URL,
            SERVER_URL: process.env.SERVER_URL,
            username:
              capitalizeFirstLetter(user?.first_name) +
              " " +
              capitalizeFirstLetter(user?.last_name),
            privacy_policy: configuration?.urls?.privacy_policy,
            instagram: configuration?.urls?.instagram,
            facebook: configuration?.urls?.facebook,
          });

          sendEmail({
            email: user?.email,
            subject: returnMessage("emailTemplate", "freeTrialEndMail"),
            message: email_template,
          });
        }

        if (
          today.isSameOrAfter(
            moment.utc(workspace?.trial_end_date).startOf("day")
          )
        ) {
          await Workspace.findOneAndUpdate(
            {
              _id: workspace?._id,
              "members.user_id": workspace?.created_by,
            },
            {
              $set: {
                "members.$.status": "payment_pending",
                trial_end_date: null,
              },
            }
          );
        }
      });
    } catch (error) {
      logger.error(
        `Error while running cron for the free tial expire: ${error}`
      );
    }
  };

  afterExpiryAlert = async () => {
    try {
      const twentyFourHoursAgo = moment().subtract(24, "hours").toDate();
      const fortyEightHoursAgo = moment().subtract(48, "hours").toDate();

      const [expiredAccounts, workspaces, config] = await Promise.all([
        Authentication.find({
          subscription_halted: {
            $gt: fortyEightHoursAgo,
            $lte: twentyFourHoursAgo,
          },
        }).lean(),
        Workspace.find({ is_deleted: false }).lean(),
        Configuration.findOne().lean(),
      ]);

      let privacy_policy = config?.urls?.privacy_policy;
      let facebook = config?.urls?.facebook;
      let instagram = config?.urls?.instagram;

      expiredAccounts.forEach(async (item) => {
        const workspace_exist = workspaces.find(
          (workspace) =>
            workspace?.created_by?.toString() === item?._id?.toString()
        );

        if (workspace_exist) {
          await notificationService.addNotification({
            module_name: "payment",
            action_name: "packageExpiredAlert",
            receiver_id: item?._id,
            user_name:
              capitalizeFirstLetter(item.first_name) +
              " " +
              capitalizeFirstLetter(item.last_name),
            workspace_id: workspace_exist?._id,
          });
        }

        const email_template = templateMaker("paymentExpireAlert.html", {
          REACT_APP_URL: process.env.REACT_APP_URL,
          SERVER_URL: process.env.SERVER_URL,
          user_name:
            capitalizeFirstLetter(item.first_name) +
            " " +
            capitalizeFirstLetter(item.last_name),
          privacy_policy,
          facebook,
          instagram,
        });

        sendEmail({
          email: item?.email,
          subject: returnMessage("emailTemplate", "planExpired"),
          message: email_template,
        });
      });
    } catch (error) {
      logger.error(`Error while running cron for after expiry alert: ${error}`);
    }
  };

  listPlan = async () => {
    try {
      return await SubscriptionPlan.find({ active: true })
        .sort({ sort_value: 1 })
        .lean();
    } catch (error) {
      logger.error(`Error while running the list plan: ${error}`);
    }
  };

  getPlan = async (payload) => {
    try {
      const { planId } = payload;
      const response = await SubscriptionPlan.findOne({ _id: planId });
      return response;
    } catch (error) {
      logger.error(`Error while running the get plan: ${error}`);
      console.log(error);
    }
  };

  updateSubscriptionPlan = async (payload, agency) => {
    try {
      const [plan_detail, sheets] = await Promise.all([
        SubscriptionPlan.findById(payload?.plan_id).lean(),
        SheetManagement.findOne({
          user_id: agency?._id,
          is_deleted: false,
        }).lean(),
      ]);

      if (!plan_detail || !plan_detail.active)
        return throwError(returnMessage("payment", "planNotFound"), 404);

      if (agency?.purchased_plan?.toString() === plan_detail?._id?.toString())
        return throwError(returnMessage("payment", "alreadySubscribed"));

      const update_subscription_obj = {
        plan_id: plan_detail?.plan_id,
        quantity: sheets?.occupied_sheets?.length + 1,
        schedule_change_at: "now",
        customer_notify: 1,
      };

      if (plan_detail?.plan_type === "unlimited") {
        update_subscription_obj.quantity = 1;
      }

      /*  const { data } = await this.razorpayApi.patch(
        `/subscriptions/${agency?.subscription_id}`,
        update_subscription_obj
      ); */

      return razorpay.subscriptions
        .update(agency?.subscription_id, update_subscription_obj)
        .then(async (data) => {
          const sheet_obj = {};
          if (plan_detail?.plan_type === "unlimited") {
            sheet_obj.total_sheets = plan_detail?.seat;
          } else if (plan_detail?.plan_type === "limited") {
            sheet_obj.total_sheets = sheets.occupied_sheets.length + 1;
          }
          await Promise.all([
            SheetManagement.findByIdAndUpdate(sheets._id, sheet_obj),
            Authentication.findByIdAndUpdate(agency?._id, {
              purchased_plan: plan_detail?._id,
            }),
            Workspace.findByIdAndUpdate(agency?.workspace, {
              plan_selection_shown: true,
            }),
          ]);
          return { success: true };
        })
        .catch((error) => {
          logger.error(`Error while updating the subscription plan: ${error}`);
          console.log(error);
          return throwError(returnMessage("default", "default"));
        });
    } catch (error) {
      logger.error(`Error while updating the subscription plan: ${error}`);
    }
  };

  //create contact for payout
  createContact = async (user) => {
    try {
      if (user?.contact_id) return;
      let { data } = await this.razorpayApi.post("/contacts", {
        name: user?.first_name + " " + user?.last_name,
        email: user?.email,
        contact: user?.contact_number,
        type: "Affiliate",
        reference_id: user?._id?.toString(),
      });

      await Promise.all([
        Authentication.findByIdAndUpdate(
          user?._id,
          { contact_id: data?.id },
          { new: true }
        ),
        Affiliate.findByIdAndUpdate(
          user?._id,
          { contact_id: data?.id },
          { new: true }
        ),
      ]);

      return data;
    } catch (error) {
      console.log(JSON.stringify(error));
      logger.error(`Error while creating the contact: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  creatFundAccount = async (payload, user) => {
    try {
      let fund_detail = {
        contact_id: user.contact_id,
        account_type: payload.account_type,
        bank_account: {
          name: payload.name,
          ifsc: payload.ifsc,
          account_number: payload.account_number,
        },
      };

      let { data } = await this.razorpayApi.post("/fund_accounts", fund_detail);

      await Authentication.findByIdAndUpdate(
        user?._id,
        { fund_id: data?.id },
        { new: true }
      );

      await Affiliate.findByIdAndUpdate(
        user?._id,
        { fund_id: data?.id },
        { new: true }
      );

      return data;
    } catch (error) {
      console.log(JSON.stringify(error));
      logger.error(`Error while creating the fund account: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  requestforPayout = async (user, payload) => {
    try {
      const refer_data = await Configuration.findOne({}).lean();
      if (user?.affiliate_point >= refer_data?.affiliate?.payout_points) {
        if (user?.affiliate_point < payload?.payout_amount) {
          return throwError(
            returnMessage("payment", "withdrawAmountNotMoreThanAffiliate")
          );
        }
        if (!user?.fund_id) {
          return throwError(returnMessage("payment", "bankDetailNotFound"));
        }
        let payoutRequest = await Payout.create({
          contact_id: user.contact_id,
          reference_id: user._id,
          email: user.email,
          contact: user?.contact_number,
          name: user.first_name + " " + user.last_name,
          fund_id: user?.fund_id,
          payout_amount: payload?.payout_amount,
          payout_requested: true,
        });

        await Affiliate.findOneAndUpdate(
          { _id: user?._id },
          { $inc: { affiliate_point: -payload?.payout_amount } },
          { new: true }
        );
        return payoutRequest;
      } else {
        return throwError(
          returnMessage("payment", "insufficientReferralPoints")
        );
      }
    } catch (error) {
      console.log(JSON.stringify(error));
      logger.error(`Error while creating the fund account: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  pendingpayout = async (payload) => {
    try {
      let filter = {
        $match: {},
      };
      let filterObj = {};
      if (payload?.payout_requested) {
        if (payload?.payout_requested === "unpaid") {
          filter["$match"] = {
            ...filter["$match"],
            payout_requested: true,
          };
        } else if (payload?.payout_requested === "paid") {
          filter["$match"] = {
            ...filter["$match"],
            payout_requested: false,
          };
        } else if (payload?.payout_requested === "All") {
        }
      }

      if (payload?.search && payload?.search !== "") {
        filterObj["$or"] = [
          {
            email: {
              $regex: payload.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "agency_data.agency_name": {
              $regex: payload.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "agency_data.first_name": {
              $regex: payload.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "agency_data.last_name": {
              $regex: payload.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "affiliates_data.affiliate_name": {
              $regex: payload.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "affiliates_data.first_name": {
              $regex: payload.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "affiliates_data.last_name": {
              $regex: payload.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            fullname: {
              $regex: payload.search.toLowerCase(),
              $options: "i",
            },
          },
        ];

        const keywordType = getKeywordType(payload.search);
        if (keywordType === "number") {
          const numericKeyword = parseInt(payload.search);

          filterObj["$or"].push({
            payout_amount: numericKeyword,
          });
        } else if (keywordType === "date") {
          const dateKeyword = new Date(payload.search);
          filterObj["$or"].push({ createdAt: dateKeyword });
          filterObj["$or"].push({ updatedAt: dateKeyword });
        }
      }
      const pagination = paginationObject(payload);
      let pipeline = [
        filter,

        {
          $lookup: {
            from: "authentications",
            let: { reference_id: { $toObjectId: "$reference_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$reference_id"] },
                },
              },
              {
                $project: {
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  agency_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
            as: "agency_data",
          },
        },
        {
          $unwind: { path: "$agency_data", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "affiliates",
            let: { reference_id: { $toObjectId: "$reference_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$reference_id"] },
                },
              },
              {
                $project: {
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  affiliate_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
            as: "affiliates_data",
          },
        },
        {
          $unwind: {
            path: "$affiliates_data",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $match: filterObj },
        {
          $project: {
            email: 1,
            contact_id: 1,
            payout_requested: 1,
            payout_amount: 1,
            createdAt: 1,
            updatedAt: 1,
            _id: 1,
            fullname: {
              $cond: {
                if: { $gt: ["$agency_data", null] },
                then: "$agency_data.agency_name",
                else: "$affiliates_data.affiliate_name",
              },
            },
          },
        },
      ];

      const pendingPayout = await Payout.aggregate(pipeline)
        .sort(pagination.sort)
        .skip(pagination.skip)
        .limit(pagination.result_per_page);
      const totalpendingPayout = await Payout.aggregate(pipeline);
      const pages = Math.ceil(
        totalpendingPayout.length / pagination.result_per_page
      );
      return { pendingPayout, page_count: pages };
    } catch (error) {
      console.log(JSON.stringify(error));
      logger.error(`Error while creating the listing payout: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  createPayouts = async (payload) => {
    try {
      let payout_details = await Payout.findById(payload?.id);

      const { data } = await this.razorpayApi.post("/payouts", {
        account_number: "2323230003384962",
        fund_account_id: payout_details?.fund_id,
        amount: payout_details?.payout_amount,
        currency: "INR",
        mode: "IMPS",
        purpose: "payout",
        reference_id: payout_details?.reference_id, // You can use a unique reference ID for each payout
      });

      if (data) {
        await Payout.findByIdAndUpdate(
          payload?.id,
          {
            payout_requested: false,
          },
          { new: true }
        );
      }

      return data;
    } catch (error) {
      console.log(JSON.stringify(error?.response?.data));
      logger.error(`Error while creating the payout: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  fetchAccountDetail = async (user) => {
    try {
      if (!user?.fund_id)
        return throwError(returnMessage("payment", "accountnotfound"));
      const { data } = await this.razorpayApi.get(
        `/fund_accounts/${user?.fund_id}`
      );

      return data;
    } catch (error) {
      console.log(JSON.stringify(error?.response?.data));
      logger.error(`Error while fetch account detail: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  glideCampaignContactDelete = async (glide_campaign_id) => {
    try {
      if (!glide_campaign_id) return;

      const submission_id = await axios.get(
        process.env.GLIDE_CAMPAIGN_CONTACT_UPDATE_URL +
          "/" +
          glide_campaign_id +
          "/submission",
        {
          auth: {
            username: process.env.GLIDE_PUBLICE_KEY,
            password: process.env.GLIDE_PRIVATE_KEY,
          },
        }
      );

      if (!submission_id?.data?.data[0]?.submission_id) return;

      await axios.delete(process.env.GLIDE_CAMPAIGN_CONTACT_DELETE_URL, {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.GLIDE_PUBLICE_KEY +
                ":" +
                process.env.GLIDE_PRIVATE_KEY
            ).toString("base64"),
          "Content-Type": "application/json",
        },
        data: { contacts: [glide_campaign_id] },
      });
      return;
    } catch (error) {
      console.log(error);
      logger.error(
        `Error while creating the contact in the glide campaign: ${error}`
      );
    }
  };

  /*  this is used to add the manuall payment flow from the admin panel
  The main process of the implementation or the flow of the Execution
  - below things are need to provide to the Admin
  -> User purchased plan
  -> user's total sheets that are available
  -> Subscription charge date
  
  below details need to get from the admin while mnuall payment
  -> How much month need to extend

  Case 1: User has purchased the limited plan
  - Required the month number need to pause 
  - get the extra Seat number from the admin and it should greater than the current
  - generate the payment history till the date
  - add the subscription pause date in the Workspace schema
  - add condition where they are adding the team member with subscription pause date
  - if agency adding the user more than the seat allocate need to throw error something like you have reached to the limit or something
  Case 2: User has purchased the unlimited plan
  - required the month number till the date where the subscription pause
  - Generate the payment history till the date
  - add the subscription pause date in the Workspace schema
  - add condition where they are adding the team member with subscription pause date

  Commong changes:
  - when user is remove the user from the subscription page neeed to check weather it has the SUbscription halt or not.
  if yes then need to remove from the seat only and they can not cancel subscription at that time because

  Razorpay Changes:
  - pause the Subscription at that time
  CRON Job:
  - check weather the subscription halt date is passed or not
  if yes then remove the date from the workspace and the resume the subscription and update the subscription as per the seats are allocated
  */

  agencyPaymentDetail = async (agency_id) => {
    try {
      const [sheets, agency_detail, workspace] = await Promise.all([
        SheetManagement.findOne({ user_id: agency_id }).lean(),
        Authentication.findById(agency_id)
          .populate("purchased_plan")
          .select("first_name last_name email contact_number purchased_plan")
          .lean(),
        Workspace.findOne({ created_by: agency_id }).lean(),
      ]);

      return {
        total_sheets: sheets?.total_sheets,
        available_sheet:
          sheets?.total_sheets - (sheets?.occupied_sheets?.length + 1),
        allocate_sheet: sheets?.occupied_sheets?.length + 1,
        plan_detail: agency_detail?.purchased_plan,
        agency_detail,
        workspace,
      };
    } catch (error) {
      logger.error(
        `Error while feching the agency payment detail by admin: ${error}`
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  manualPayment = async (payload) => {
    try {
      const { agency_id, extra_sheet, pause_subscription_date } = payload;

      const today = moment.utc().startOf("day");
      if (!agency_id)
        return throwError(returnMessage("admin", "agencyRequired"));

      if (!pause_subscription_date)
        return throwError(
          returnMessage("admin", "subscriptionPauseDateRequired")
        );

      const subscription_pause_date = moment
        .utc(pause_subscription_date, "DD-MM-YYYY")
        .startOf("day");

      if (!subscription_pause_date.isSameOrAfter(today))
        return throwError(returnMessage("admin", "futureSubsPauseDate"));

      const [agency_detail, workspace_detail, sheet] = await Promise.all([
        Authentication.findById(agency_id)
          .where("is_deleted")
          .ne(true)
          .populate("purchased_plan")
          .lean(),
        Workspace.findOne({ created_by: agency_id, is_deleted: false }).lean(),
        SheetManagement.findOne({
          user_id: agency_id,
          is_deleted: false,
        }).lean(),
      ]);

      if (!agency_detail)
        return throwError(
          returnMessage("agency", "agencyNotFound"),
          statusCode?.notFound
        );

      if (workspace_detail?.trial_end_date)
        return throwError(returnMessage("admin", "trailEndManual"));

      // removed the flow of to check the pasue date should be greater than the existing pasue subscription date
      /* if (workspace_detail?.pause_subscription_date) {
        const date = moment
          .utc(workspace_detail?.pause_subscription_date)
          .startOf("day");
        if (!subscription_pause_date?.isAfter(date))
          return throwError(returnMessage("admin", "futureSubsPauseDate"));
      } */

      if (
        extra_sheet &&
        agency_detail?.purchased_plan?.plan_type === "limited"
      ) {
        await SheetManagement.findByIdAndUpdate(sheet?._id, {
          total_sheets: Math.abs(sheet?.total_sheets) + Math.abs(extra_sheet),
        });
      }

      await Workspace.findOneAndUpdate(
        { _id: workspace_detail?._id, "members.user_id": agency_id },
        {
          $set: {
            pause_subscription_date: subscription_pause_date,
            "members.$.status": "confirmed",
          },
        },
        { new: true }
      );

      await PaymentHistory.create({
        agency_id,
        payment_mode: "manual",
        plan_id: agency_detail?.purchased_plan?._id,
        quantity: extra_sheet
          ? sheet?.total_sheets + Math.abs(extra_sheet)
          : sheet?.total_sheets,
      });

      if (!workspace_detail?.pause_subscription_date) {
        razorpay.subscriptions
          .pause(agency_detail?.subscription_id, { pause_at: "now" })
          .then((data) => console.log("subscription paused successfully"))
          .catch((error) =>
            console.log("error while pausing the subscription", error)
          );
      }
    } catch (error) {
      logger.error(`Error While doing manual payment: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  cronJobToExpireManualPayment = async () => {
    try {
      const today = moment.utc().startOf("day");
      const workspaces = await Workspace.find({
        is_deleted: false,
        $and: [
          { pause_subscription_date: { $exists: true } },
          { pause_subscription_date: { $ne: null } },
        ],
      })
        .populate("created_by", "email subscription_id")
        .lean();

      workspaces.map(async (workspace) => {
        if (!workspace?.pause_subscription_date) return;
        const subscription_end_date = moment
          .utc(workspace?.pause_subscription_date)
          .startOf("day");

        if (!today.isAfter(subscription_end_date)) return;

        await Workspace.findOneAndUpdate(
          {
            _id: workspace?._id,
            "members.user_id": workspace?.created_by?._id,
          },
          {
            $set: {
              "members.$.status": "payment_pending",
            },
            $unset: { pause_subscription_date: undefined },
          }
        );
        const sheet = await SheetManagement.findOne({
          user_id: workspace?.created_by?._id,
          is_deleted: false,
        }).lean();
        // resume subscription as this is active now

        if (sheet) {
          razorpay.subscriptions
            .resume(workspace?.created_by?.subscription_id, {
              resume_at: "now",
            })
            .then((data) => {
              console.log("subscription resumed successfully");
              razorpay.subscriptions
                .update(workspace?.created_by?.subscription_id, {
                  quantity: sheet?.total_sheets,
                })
                .then((data) =>
                  console.log("Subscription updated successfully")
                )
                .catch((error) =>
                  console.log("Error while updating subscription", error)
                );
            })
            .catch((error) =>
              console.log("Error while resuming the subscription", error)
            );
        }
      });
    } catch (error) {
      logger.error(`Error while Expiring manual payment flow `);
      console.log(error);
    }
  };
}

module.exports = PaymentService;
