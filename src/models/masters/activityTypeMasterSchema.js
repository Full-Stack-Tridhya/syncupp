const mongoose = require("mongoose");
const { crm_connection } = require("../../config/connection");

const activityTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      //   enum: ["pending", "overdue", "inprogress", "completed"],
      enum: ["task", "call_meeting", "others"],
    },
    // label: { type: String, required: true },
  },
  { timestamps: true }
);

const Activity_Type_Master = crm_connection.model(
  "activity_type_master",
  activityTypeSchema
);

module.exports = Activity_Type_Master;
