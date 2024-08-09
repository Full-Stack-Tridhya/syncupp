const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const groupChatSchema = new mongoose.Schema(
  {
    group_name: { type: String, required: true },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "authentication",
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "authentication" }],
    is_deleted: { type: Boolean, default: false },
    workspace_id: { type: mongoose.Schema.Types.ObjectId, ref: "workspaces" },
    image_url: { type: String },
  },
  { timestamps: true }
);

const Group_Chat = crm_connection.model("group_chat", groupChatSchema);

module.exports = Group_Chat;
