const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const authenticationSchema = new mongoose.Schema(
  {
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String, required: true },
    password: { type: String },
    contact_number: { type: String },
    is_google_signup: { type: Boolean, default: false },
    is_facebook_signup: { type: Boolean, default: false },
    reset_password_token: { type: String },
    remember_me: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    profile_image: { type: String },
    status: {
      type: String,
      enum: ["signup_incomplete", "signup_completed", "inactive"],
      default: "signup_incomplete",
    },
    subscription_id: { type: String },
    contact_id: { type: String },
    fund_id: { type: String },
    subscribe_date: { typr: String },
    order_id: { type: String },
    referral_code: { type: String },
    affiliate_referral_code: { type: String },
    last_login_date: { type: Date },
    click_count: { type: Number, default: 0 },
    is_online: { type: Boolean, default: false },
    subscription_halted: { type: Date },
    subscription_halted_displayed: { type: Boolean, default: false },
    purchased_plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subscription_plan",
    },
    affiliate_point: { type: Number, default: 0 },
    total_affiliate_earned_point: { type: Number, default: 0 },
    glide_campaign_id: { type: String },
    city: { type: mongoose.Schema.Types.ObjectId, ref: "city_master" },
    state: { type: mongoose.Schema.Types.ObjectId, ref: "state_master" },
    country: { type: mongoose.Schema.Types.ObjectId, ref: "country_master" },
    pincode: { type: String },
    company_name: { type: String },
    company_website: { type: String },
    no_of_people: { type: String },
    industry: { type: String },
    address: { type: String },
    profession_role: { type: String },
    gst: { type: String },
    bio: { type: String },
  },
  { timestamps: true }
);

const Authentication = crm_connection.model(
  "authentication",
  authenticationSchema
);

authenticationSchema.index({ email: 1 });
authenticationSchema.index({ contact_number: 1 });

module.exports = Authentication;
