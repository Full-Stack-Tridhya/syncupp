const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const paymentHistorySchema = new mongoose.Schema(
  {
    agency_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "authentication",
    },
    member_id: { type: mongoose.Schema.Types.ObjectId, ref: "authentication" },
    role: { type: String },
    subscription_id: { type: String },
    order_id: { type: String },
    amount: { type: Number },
    currency: { type: String },
    payment_mode: {
      type: String,
      enum: ["payment", "referral", "free_trial", "manual"],
      default: "payment",
    },
    payment_id: { type: String },
    first_time: { type: Boolean, default: false },
    plan_id: { type: String },
    quantity: { type: Number, default: 1 },
    workspace_id: { type: mongoose.Schema.ObjectId, ref: "workspaces" },
  },
  { timestamps: true }
);

const PaymentHistory = crm_connection.model(
  "payment_history",
  paymentHistorySchema
);

module.exports = PaymentHistory;
