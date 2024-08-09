const mongoose = require("mongoose");
const { admin_connection } = require("../../config/connection");

const pricePlaneSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Price_Plan = admin_connection.model("price_plan_cms", pricePlaneSchema);

module.exports = Price_Plan;
