const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const PayoutSchema = new mongoose.Schema(
  {
    email: { type: String },
    click_count: { type: Number, default: 0 }, // New field to track link clicks
    contact_id: { type: String },
    fund_id: { type: String },
    payout_requested: { type: Boolean, default: false },
    payout_amount: { type: Number },
    reference_id: { type: String },
  },
  { timestamps: true }
);

const Payout = crm_connection.model("Payout", PayoutSchema);
module.exports = Payout;
