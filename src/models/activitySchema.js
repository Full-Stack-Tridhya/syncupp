const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    workspace_id: {
      type: mongoose.Types.ObjectId,
      ref: "workspace",
      required: true,
    },
    agenda: { type: String },
    internal_info: { type: String },
    google_meeting_data: {
      meet_link: { type: String },
      event_id: { type: String },
    },
    created_by: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "authentication",
    },
    meeting_start_time: { type: Date },
    meeting_end_time: { type: Date },
    all_day: { type: Boolean, default: false },
    alert_time: { type: Number },
    alert_time_unit: {
      type: String,
      enum: ["h", "min"],
    },
    activity_status: {
      type: mongoose.Types.ObjectId,
      ref: "activity_status_master",
      required: true,
    },
    is_deleted: { type: Boolean, default: false },
    attendees: [
      {
        type: mongoose.Types.ObjectId,
        ref: "authentication",
      },
    ],
    refresh_token: {
      type: String,
    },
    access_token: {
      type: String,
    },
    // Recurring fields
    recurring: {
      type: Boolean,
      default: false,
    },
    recurrence_pattern: {
      type: String,
      required: function () {
        return this.recurrence_pattern;
      },
      enum: ["daily", "weekly", "monthly"],
    },
    recurrence_interval: {
      type: Number,
      min: 0,
      required: function () {
        return this.recurrence_pattern;
      },
    },
    meeting_date: {
      type: Date,
      required: true,
    },
    recurrence_end_date: {
      type: Date,
      required: function () {
        return this.recurrence_pattern;
      },
    },
    weekly_recurrence_days: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      optional: true,
    },
    monthly_recurrence_day_of_month: {
      type: Number,
      min: 1,
      max: 31,
      optional: true,
    },
  },
  { timestamps: true }
);

const Activity = crm_connection.model("activity", activitySchema);
module.exports = Activity;
