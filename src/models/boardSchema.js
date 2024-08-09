const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const boardSchema = new mongoose.Schema(
  {
    project_name: { type: String, required: true },
    description: { type: String },
    members: [
      {
        member_id: { type: mongoose.Types.ObjectId, ref: "authentication" },
        is_pinned: { type: Boolean, default: false },
      },
    ],
    board_image: { type: String },
    agency_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "authentication",
    },
    created_by: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "authentication",
    },
    workspace_id: {
      type: mongoose.Types.ObjectId,
      ref: "workspaces",
      required: true,
    },
    is_deleted: { type: Boolean, default: false },
    board_status: {
      type: mongoose.Types.ObjectId,
      ref: "board_status_masters",
    },
  },
  { timestamps: true }
);

const Board = crm_connection.model("board", boardSchema);

module.exports = Board;
