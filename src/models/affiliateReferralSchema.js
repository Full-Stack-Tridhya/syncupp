const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const affiliateReferralSchema = new mongoose.Schema(
  {
    referral_code: {
      type: String,
      required: true,
    },
    referred_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "affiliate",
      required: true,
    },
    referred_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "authentication",
      required: true,
    },
    status: { type: String, default: "inactive" },
    payment_id: {
      type: String,
    },
  },
  { timestamps: true }
);

const Affiliate_Referral = crm_connection.model(
  "affiliate_referral",
  affiliateReferralSchema
);

module.exports = Affiliate_Referral;
