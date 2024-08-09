const mongoose = require("mongoose");
const { admin_connection } = require("../../config/connection");

const cancellationAndRefundSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const cancellation_and_Refund = admin_connection.model(
  "cancellation_and_Refund",
  cancellationAndRefundSchema
);

module.exports = cancellation_and_Refund;
