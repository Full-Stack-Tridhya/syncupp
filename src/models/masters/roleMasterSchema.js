const mongoose = require("mongoose");
const { crm_connection } = require("../../config/connection");

const roleMasterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["agency", "client", "team_agency", "team_client"],
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Role_Master = crm_connection.model("role_master", roleMasterSchema);

module.exports = Role_Master;
