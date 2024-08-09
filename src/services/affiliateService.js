const jwt = require("jsonwebtoken");
const Affiliate = require("../models/affiliateSchema");
const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const {
  returnMessage,
  forgotPasswordEmailTemplate,
  passwordValidation,
  validateEmail,
  templateMaker,
  capitalizeFirstLetter,
} = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../helpers/sendEmail");
const Affiliate_Referral = require("../models/affiliateReferralSchema");
const Authentication = require("../models/authenticationSchema");
const moment = require("moment");
const Configuration = require("../models/configurationSchema");
const paymentService = require("../services/paymentService");
const PaymentService = new paymentService();
const Payout = require("../models/payoutSchema");

class AffiliateService {
  // Generate Token
  tokenGenerator = (payload) => {
    try {
      const expiresIn = process.env.JWT_EXPIRES_IN;
      const token = jwt.sign(
        { id: payload._id },
        process.env.JWT_AFFILIATE_SECRET_KEY,
        {
          expiresIn,
        }
      );
      return { token, user: payload };
    } catch (error) {
      logger.error(`Error while token generate, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Affiliate Sign Up
  signUp = async (payload) => {
    try {
      const { email, password, company_name, first_name, last_name } = payload;

      if (!validateEmail(email)) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }

      if (!passwordValidation(password)) {
        return throwError(returnMessage("auth", "invalidPassword"));
      }

      const user = await Affiliate.findOne({ email: email });
      if (user) {
        return throwError(returnMessage("affiliate", "emailExist"));
      }

      const hash_password = await bcrypt.hash(password, 14);

      const generateReferralCode = await this.referralCodeGenerator();

      let newUser = await Affiliate.create({
        email,
        password: hash_password,
        company_name,
        first_name,
        last_name,
        referral_code: generateReferralCode,
      });
      newUser.save();

      newUser = newUser.toObject();
      delete newUser?.password;
      delete newUser?.is_deleted;
      PaymentService.createContact(newUser);
      return this.tokenGenerator({
        ...newUser,
      });
    } catch (error) {
      logger.error(`Error while affiliate signup: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Affiliate Login In
  logIn = async (payload) => {
    try {
      const { email, password } = payload;

      if (!email || !password) {
        return throwError(returnMessage("auth", "emailPassNotFound"));
      }

      if (!validateEmail(email)) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }

      if (!passwordValidation(password)) {
        return throwError(returnMessage("auth", "invalidPassword"));
      }

      const user = await Affiliate.findOne(
        { email, is_deleted: false },
        { is_deleted: 0 }
      );

      if (!user) {
        return throwError(returnMessage("affiliate", "incorrectPassword"));
      }
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return throwError(returnMessage("affiliate", "incorrectPassword"));
      }
      delete user._doc?.password;
      return this.tokenGenerator({
        ...user._doc,
      });
    } catch (error) {
      logger.error(`Error while affiliate signup: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Affiliate Change Password
  changePassword = async (payload, user_id) => {
    try {
      const { new_password, old_password } = payload;

      if (!old_password) {
        return throwError(returnMessage("auth", "oldPassRequired"));
      }

      if (new_password === old_password) {
        return throwError(returnMessage("auth", "oldAndNewPasswordSame"));
      }

      if (!passwordValidation(new_password)) {
        return throwError(returnMessage("auth", "invalidPassword"));
      }

      const user = await Affiliate.findById({ _id: user_id });
      if (!user) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }

      const is_match = await bcrypt.compare(old_password, user.password);
      if (!is_match) {
        return throwError(returnMessage("auth", "passwordNotMatch"));
      }
      const hash_password = await bcrypt.hash(new_password, 14);
      user.password = hash_password;
      await user.save();
    } catch (error) {
      logger.error(`Error while Affiliate changePassword, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Affiliate Forgot Password
  forgotPassword = async (payload) => {
    try {
      const { email } = payload;

      if (!validateEmail(email)) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }

      const user = await Affiliate.findOne({ email: email }, { password: 0 });
      if (!user) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }
      const reset_password_token = crypto.randomBytes(32).toString("hex");
      const encode = encodeURIComponent(email);
      const link = `${process.env.REACT_WEBSITE_APP_URL}/affiliate/reset-password?token=${reset_password_token}&email=${encode}`;
      const company_urls = await Configuration.findOne().lean();
      const privacy_policy = company_urls?.urls?.privacy_policy;
      const facebook = company_urls?.urls?.facebook;
      const instagram = company_urls?.urls?.instagram;

      const email_template = templateMaker("forgotPassword.html", {
        REACT_APP_URL: process.env.REACT_WEBSITE_APP_URL,
        SERVER_URL: process.env.SERVER_URL,
        link,
        username:
          capitalizeFirstLetter(user?.first_name) +
          " " +
          capitalizeFirstLetter(user?.last_name),
        privacy_policy,
        facebook,
        instagram,
      });

      await sendEmail({
        email: email,
        subject: returnMessage("emailTemplate", "forgotPasswordSubject"),
        message: email_template,
      });

      const hash_token = crypto
        .createHash("sha256")
        .update(reset_password_token)
        .digest("hex");
      user.reset_password_token = hash_token;
      await user.save();
      return;
    } catch (error) {
      logger.error(`Error while affiliate forgotpassword, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Affiliate  get Profile
  getProfile = async (user) => {
    try {
      const getUser = await Affiliate.findOne(
        { _id: user._id, is_deleted: false },
        { is_deleted: 0, password: 0, __v: 0 }
      );

      return getUser;
    } catch (error) {
      logger.error(`Error while affiliate signup: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Affiliate  get Profile
  updateProfile = async (payload, user) => {
    try {
      const { first_name, last_name, company_name } = payload;
      await Affiliate.findOneAndUpdate(
        {
          _id: user._id,
        },
        { first_name, last_name, company_name },
        { new: true, useFindAndModify: false }
      );

      return;
    } catch (error) {
      logger.error(`Error while affiliate signup: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Affiliate Reset Password

  resetPassword = async (payload) => {
    try {
      const { token, email, new_password } = payload;

      if (!passwordValidation(new_password)) {
        return throwError(returnMessage("auth", "invalidPassword"));
      }

      const hash_token = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const user = await Affiliate.findOne({
        email: email,
        reset_password_token: hash_token,
        is_deleted: false,
      });

      if (!user) {
        return throwError(returnMessage("auth", "invalidToken"));
      }

      const hash_password = await bcrypt.hash(new_password, 14);
      user.password = hash_password;
      user.reset_password_token = null;
      await user.save();
      return;
    } catch (error) {
      logger.error(`Error while affiliate resetPassword, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  referralCodeGenerator = async () => {
    try {
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let referral_code = "";
      // Generate the initial code
      for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        referral_code += characters.charAt(randomIndex);
      }

      const referral_code_exist = await Affiliate.findOne({
        referral_code,
      })
        .select("referral_code")
        .lean();
      if (referral_code_exist) return this.referralCodeGenerator();

      return referral_code;
    } catch (error) {
      logger.error("Error while generating the referral code", error);
      return false;
    }
  };

  getDashboardData = async (user) => {
    try {
      const currentDate = moment();
      const startOfPreviousMonth = moment(currentDate)
        .subtract(1, "months")
        .startOf("month")
        .utc();
      const endOfPreviousMonth = moment(currentDate)
        .subtract(1, "months")
        .endOf("month")
        .utc();
      const commissionPercentage = await Configuration.findOne({});
      let clickData;
      let searchId;

      searchId = user?._id;
      clickData = await Affiliate.findById(user?._id).lean();

      if (!clickData)
        clickData = await Authentication.findById(user?._id).lean();

      const [
        totalReferralsCount,
        total_agencies,
        lastMonthEarning,
        totalEarning,
      ] = await Promise.all([
        Affiliate_Referral.countDocuments({
          referred_by: searchId,
        }),
        Affiliate_Referral.countDocuments({
          referred_by: searchId,
          status: "active",
        }),
        Affiliate_Referral.aggregate([
          {
            $match: {
              referred_by: searchId,
              status: "active",
              updatedAt: {
                $gte: startOfPreviousMonth.toDate(),
                $lte: endOfPreviousMonth.toDate(),
              },
            },
          },
          {
            $lookup: {
              from: "subscription_plans",
              localField: "payment_id",
              foreignField: "plan_id",
              as: "planData",
            },
          },
          {
            $unwind: {
              path: "$planData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$planData.amount" },
            },
          },
          {
            $project: {
              _id: 0,
              totalAmount: 1,
              total: {
                $multiply: [
                  "$totalAmount",
                  commissionPercentage.referral.commission_percentage / 100,
                ],
              },
            },
          },
        ]),
        Affiliate_Referral.aggregate([
          {
            $match: {
              referred_by: searchId,
              status: "active",
            },
          },
          {
            $lookup: {
              from: "subscription_plans",
              localField: "payment_id",
              foreignField: "plan_id",
              as: "planData",
            },
          },
          {
            $unwind: {
              path: "$planData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$planData.amount" },
            },
          },
          {
            $project: {
              _id: 0,
              totalAmount: 1,
              total: {
                $multiply: [
                  "$totalAmount",
                  commissionPercentage.referral.commission_percentage / 100,
                ],
              },
            },
          },
        ]),
      ]);

      const detailsPayout = await Payout.find({
        reference_id: user?._id,
        payout_requested: true,
      }).lean();
      const sum_payout_requested = detailsPayout.reduce((acc, curr) => {
        return acc + parseInt(curr.payout_amount);
      }, 0);

      const detailsPayouts = await Payout.find({
        reference_id: user?._id,
        payout_requested: false,
      }).lean();

      const sum_payout_points_withdraw = detailsPayouts.reduce((acc, curr) => {
        return acc + parseInt(curr.payout_amount);
      }, 0);

      const unpaid_requested =
        user.total_affiliate_earned_point - sum_payout_requested;

      return {
        referral_count: totalReferralsCount ?? 0,
        customer_count: total_agencies ?? 0,
        click_count: clickData?.click_count ?? 0,
        last_month_earning: lastMonthEarning[0]?.total ?? 0,
        total_earning: user?.total_affiliate_earned_point,
        withdraw: sum_payout_points_withdraw,
        payout_requested: sum_payout_requested,
        unpaid: unpaid_requested,
        total_points: user?.affiliate_point,
        fund_id: user?.fund_id,
      };
    } catch (error) {
      logger.error("Error while getting dashboard data", error);
      return false;
    }
  };

  clickCount = async (payload) => {
    try {
      const { referral_code } = payload;

      // Find the affiliate by ID
      const affiliate = await Affiliate.findOne({
        referral_code: referral_code,
      });

      const user = await Authentication.findOne({
        affiliate_referral_code: referral_code,
      });

      if (!affiliate && !user) {
        return throwError(returnMessage("affiliate", "affiliateNotFound"));
      }

      if (affiliate) {
        affiliate.click_count += 1;
        await affiliate.save();
      }

      if (user) {
        user.click_count += 1;
        await user.save();
      }
      return;
    } catch (error) {
      logger.error("Error while Click count", error);
      return false;
    }
  };
}

module.exports = AffiliateService;
