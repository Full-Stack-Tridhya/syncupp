const mongoose = require("mongoose");
const { admin_connection } = require("../../config/connection");

const privacyPolicySchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Privacy_Policy = admin_connection.model(
  "privacy_policy_cms",
  privacyPolicySchema
);

module.exports = Privacy_Policy;
