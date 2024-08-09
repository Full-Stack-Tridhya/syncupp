const mongoose = require("mongoose");
const { admin_connection } = require("../config/connection");

const adminFaqSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const AdminFaq = admin_connection.model("admin_faq", adminFaqSchema);
module.exports = AdminFaq;
