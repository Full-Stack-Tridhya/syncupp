const mongoose = require("mongoose");
const { crm_connection } = require("../config/connection");

const settingSchema = new mongoose.Schema(
  {
    workspace_id: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    invoice: {
      logo: { type: String },
    },
  },
  { timestamps: true }
);

const Setting = crm_connection.model("setting", settingSchema);
module.exports = Setting;
