const mongoose = require("mongoose");
const { crm_connection } = require("../../config/connection");

const currencySchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
    },
    code: {
      type: String,
    },
    name: {
      type: String,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Currency = crm_connection.model("currency", currencySchema);

module.exports = Currency;
