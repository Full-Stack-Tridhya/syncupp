const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const sectionSchema = new mongoose.Schema(
  {
    board_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "board",
    },
    workspace_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "workspaces",
    },
    section_name: { type: String, required: true },
    sort_order: { type: Number },
    is_deletable: { type: Boolean, default: true },
    key: { type: String },
    color: { type: String, required: true },
    test_color: { type: String, required: true },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Section = crm_connection.model("section", sectionSchema);
module.exports = Section;
