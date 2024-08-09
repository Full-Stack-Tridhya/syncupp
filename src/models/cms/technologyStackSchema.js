const mongoose = require("mongoose");
const { admin_connection } = require("../../config/connection");

const technologyStackSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Technology_Stack = admin_connection.model(
  "technology_stack_cms",
  technologyStackSchema
);

module.exports = Technology_Stack;
