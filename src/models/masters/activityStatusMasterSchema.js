const mongoose = require("mongoose");
const { crm_connection } = require("../../config/connection");

const activityStatusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["pending", "overdue", "in_progress", "completed", "cancel"],
    },
    // label: { type: String, required: true },
  },
  { timestamps: true }
);

const Activity_Status_Master = crm_connection.model(
  "activity_status_master",
  activityStatusSchema
);

module.exports = Activity_Status_Master;
