const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const sheetManagementSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "authentication",
      required: true,
    },
    total_sheets: { type: Number, default: 1 },
    occupied_sheets: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "authentication",
          required: true,
        },
        role: {
          type: mongoose.Schema.ObjectId,
          ref: "role_master",
          required: true,
        },
        date: { type: Date, default: new Date() },
        workspace: { type: mongoose.Schema.ObjectId, ref: "workspaces" },
      },
    ],
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SheetManagement = crm_connection.model(
  "sheet_management",
  sheetManagementSchema
);
module.exports = SheetManagement;
