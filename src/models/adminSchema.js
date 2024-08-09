const mongoose = require("mongoose");
const { admin_connection } = require("../config/connection");

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    reset_password_token: { type: String },
    contact_number: { type: String },
    is_deleted: { type: Boolean, default: false },
    remember_me: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Admin = admin_connection.model("admin", adminSchema);
module.exports = Admin;
