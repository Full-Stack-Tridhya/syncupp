const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const affiliateSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    company_name: { type: String, required: true },
    last_name: { type: String, required: true },
    first_name: { type: String, required: true },
    reset_password_token: { type: String },
    invitation_token: { type: String },
    is_deleted: { type: Boolean, default: false },
    referral_code: { type: String, required: true },
    click_count: { type: Number, default: 0 }, // New field to track link clicks
    contact_id: { type: String },
    fund_id: { type: String },
    affiliate_point: { type: Number, default: 0 },
    total_affiliate_earned_point: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Affiliate = crm_connection.model("affiliate", affiliateSchema);
module.exports = Affiliate;
