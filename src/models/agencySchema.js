const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const agencySchema = new mongoose.Schema(
  {
    company_name: { type: String },
    company_website: { type: String },
    no_of_people: { type: String },
    industry: { type: String },
    address: { type: String },
    city: { type: mongoose.Schema.Types.ObjectId, ref: "city_master" },
    state: { type: mongoose.Schema.Types.ObjectId, ref: "state_master" },
    country: { type: mongoose.Schema.Types.ObjectId, ref: "country_master" },
    pincode: { type: String },
    total_referral_point: { type: Number, default: 0 },
    total_coupon: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
  },
  { timestamps: true }
);

const Agency = crm_connection.model("agency", agencySchema);

module.exports = Agency;
