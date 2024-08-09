const mongoose = require("mongoose");
const { admin_connection } = require("../../config/connection");

const admintermAndConditionSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
  },
  { timestamps: true }
);

const AdminTermAndCondition = admin_connection.model(
  "admin_term_and_condition",
  admintermAndConditionSchema
);
module.exports = AdminTermAndCondition;
