const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String },
    agenda: { type: String },
    due_date: { type: Date },
    due_time: { type: String },
    created_by: { type: mongoose.Types.ObjectId },
    event_start_time: { type: Date },
    event_end_time: { type: Date },
    recurring_end_date: { type: Date },
    email: [
      {
        type: String,
      },
    ],
    agency_id: { type: mongoose.Types.ObjectId },
    internal_info: { type: String },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Event = crm_connection.model("Schedule_event", eventSchema);
module.exports = Event;
