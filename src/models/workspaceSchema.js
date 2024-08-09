const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, requied: true },
    created_by: {
      type: mongoose.Schema.ObjectId,
      ref: "authentication",
      required: true,
    },
    members: [
      {
        user_id: {
          type: mongoose.Schema.ObjectId,
          ref: "authentication",
          required: true,
        },
        role: {
          type: mongoose.Schema.ObjectId,
          ref: "role_master",
          required: true,
        },
        sub_role: {
          type: mongoose.Schema.ObjectId,
          ref: "team_role_master",
        },
        status: {
          type: String,
          enum: [
            "payment_pending",
            "confirmed",
            "confirm_pending",
            "inactive",
            "deleted",
            "free_trial",
            "rejected",
            "requested",
            "subscription_cancelled",
          ],
          default: "confirm_pending",
        },
        client_id: { type: mongoose.Schema.ObjectId, ref: "authentication" },
        invitation_token: { type: String },
        joining_date: { type: Date },
        gamification_points: { type: Number, default: 0 },
        last_visit_date: { type: Date },
        total_coupon: [{ type: mongoose.Schema.Types.ObjectId }],
      },
    ],
    trial_end_date: { type: Date },
    pause_subscription_date: { type: Date },
    is_deleted: { type: Boolean, default: false },
    plan_selection_shown: { type: Boolean, default: false },
  },
  { timestamps: true }
);

workspaceSchema.index({ name: 1 });

const Workspace = crm_connection.model("workspaces", workspaceSchema);
module.exports = Workspace;
