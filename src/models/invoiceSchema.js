const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const invoiceSchema = new mongoose.Schema(
  {
    invoice_number: { type: String, required: true },
    client_id: { type: mongoose.Types.ObjectId, ref: "authentication" },
    due_date: { type: Date, required: true },
    invoice_date: { type: Date, required: true },
    invoice_logo: { type: String },
    status: {
      type: mongoose.Types.ObjectId,
      ref: "invoice_status_master",
      required: true,
    },
    agency_id: {
      type: mongoose.Types.ObjectId,
      ref: "authentication",
      required: true,
    },
    workspace_id: {
      type: mongoose.Types.ObjectId,
      ref: "workspace",
      required: true,
    },
    currency: {
      type: mongoose.Types.ObjectId,
      ref: "currency",
      required: true,
    },
    memo: { type: String },
    invoice_content: [
      {
        item: { type: String, required: true },
        qty: { type: Number, required: true, min: 1 },
        rate: { type: Number, required: true, min: 0 },
        tax: { type: Number, required: true, min: 0, max: 100 },
        amount: { type: Number, required: true, min: 0 },
        description: { type: String, required: true },
      },
    ],
    is_deleted: { type: Boolean, default: false },
    sub_total: { required: true, type: Number },
    total: { required: true, type: Number },
    // this will use when we want to add the client manually which are not in the system
    custom_client: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      name: { type: String },
      email: { type: String },
      address: { type: String },
      contact_number: { type: String },
    },
  },
  { timestamps: true }
);

const Invoice = crm_connection.model("invoice", invoiceSchema);

module.exports = Invoice;
