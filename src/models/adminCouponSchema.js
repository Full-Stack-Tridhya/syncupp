const mongoose = require("mongoose");
const { admin_connection } = require("../config/connection");

const adminCouponSchema = new mongoose.Schema(
  {
    brand: { type: String, requried: true },
    couponCode: { type: String, required: true },
    discountTitle: { type: String, required: true },
    siteURL: { type: String, required: true },
    brandLogo: { type: String, required: true },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const AdminCoupon = admin_connection.model("admin_coupon", adminCouponSchema);
module.exports = AdminCoupon;
