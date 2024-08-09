const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const configurationSchema = new mongoose.Schema(
  {
    referral: {
      successful_referral_point: { type: Number, default: 500 },
      redeem_required_point: { type: Number, default: 2000 },
      commission_percentage: { type: Number, default: 30 },
    },
    competition: {
      successful_task_competition: { type: Number, default: 20 },
      successful_login: { type: Number, default: 10 },
    },
    cron_job: {
      invoice_overdue: { type: String, default: "0 0 * * *" },
      task_overdue: { type: String, default: "0 0 * * *" },
      task_dueDate: { type: String, default: "0 0 * * *" },
      call_meeting_alert: { type: Number, default: 15 },
      call_meeting_alert_check_rate: { type: String, default: "* * * * *" },
      payment: { type: String, default: "0 0 * * *" },
      after_expire_alert_time: { type: String, default: "0 0 * * *" },
    },
    payment: {
      subscription_halt_days: { type: Number, default: 15 },
      free_trial: { type: Number, default: 7 },
    },
    multer: {
      size: { type: Number, default: 200 },
      profileSize: { type: Number, default: 1 },
    },
    chat: {
      file_size: { type: Number, default: 200 },
    },
    coupon: {
      reedem_coupon: { type: Number, default: 50 },
    },
    urls: {
      privacy_policy: { type: String },
      facebook: { type: String },
      instagram: { type: String },
    },
  },
  { timestamps: true }
);

const Configuration = crm_connection.model(
  "configuration",
  configurationSchema
);
module.exports = Configuration;
