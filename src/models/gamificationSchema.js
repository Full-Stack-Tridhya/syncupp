const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const gamificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Types.ObjectId,
      ref: "authentication",
      required: true,
    },
    agency_id: {
      type: mongoose.Types.ObjectId,
      ref: "authentication",
      required: true,
    },
    role: { type: mongoose.Types.ObjectId, ref: "role_master" },
    point: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["task", "login", "referral", "coupon_purchase"],
    },
    workspace_id: { type: mongoose.Types.ObjectId, ref: "workspaces" },
    task_id: { type: mongoose.Types.ObjectId, ref: "task" },
    referral_user_id: { type: mongoose.Types.ObjectId, ref: "authentication" },
  },
  { timestamps: true }
);

const Gamification = crm_connection.model("gamifications", gamificationSchema);

gamificationSchema.index({ workspace_id: 1, user_id: 1, agency_id: 1 });
module.exports = Gamification;
