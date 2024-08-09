const mongoose = require("mongoose");
const { crm_connection } = require("../../config/connection");

const invoiceStatusMaster = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["draft", "paid", "unpaid", "overdue"],
    },
    label: { type: String },
  },
  { timestamps: true }
);

const Invoice_status_master = crm_connection.model(
  "invoice_status_master",
  invoiceStatusMaster
);

module.exports = Invoice_status_master;
