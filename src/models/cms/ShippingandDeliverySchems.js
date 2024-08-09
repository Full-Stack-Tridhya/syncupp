const mongoose = require("mongoose");
const { admin_connection } = require("../../config/connection");

const ShippingandDeliverySchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Shipping_and_Delivery = admin_connection.model(
  "Shipping_and_Delivery",
  ShippingandDeliverySchema
);

module.exports = Shipping_and_Delivery;
