const mongoose = require("mongoose");
const { admin_connection } = require("../config/connection");

const inquirySchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    contact_number: {
      type: String,
      required: true,
    },
    country: { type: String },
    no_of_people: {
      type: String,
    },
    thoughts: {
      type: String,
      required: true,
    },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const inquiry = admin_connection.model("inquiry", inquirySchema);
module.exports = inquiry;
