const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const agreementSchema = new mongoose.Schema(
  {
    agency_id: {
      type: mongoose.Types.ObjectId,
      ref: "authentication",
      required: true,
    },
    due_date: { type: Date, required: true },
    title: { type: String, required: true },
    receiver: { type: mongoose.Types.ObjectId, ref: "authentication" },
    workspace_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "workspace",
    },
    agreement_content: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "sent", "agreed"],
      default: "draft",
    },
    custom_receiver: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      name: { type: String },
      email: { type: String },
      address: { type: String },
      contact_number: { type: String },
    },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Agreement = crm_connection.model("agreement", agreementSchema);
module.exports = Agreement;
