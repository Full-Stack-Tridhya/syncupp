const mongoose = require("mongoose");
const { admin_connection } = require("../../config/connection");

const contactUsSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Contact_Us = admin_connection.model("contact_us_cms", contactUsSchema);

module.exports = Contact_Us;
