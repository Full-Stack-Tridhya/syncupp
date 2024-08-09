const mongoose = require("mongoose");
const { admin_connection } = require("../config/connection");

const adminClientReviewSchema = new mongoose.Schema(
  {
    client_review_image: { type: String },
    customer_name: { type: String, requried: true },
    company_name: { type: String, requried: true },
    review: { type: String, required: true },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const AdminClientReview = admin_connection.model(
  "admin_client_review",
  adminClientReviewSchema
);
module.exports = AdminClientReview;
