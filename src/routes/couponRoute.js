const couponRoute = require("express").Router();
const { protect, authorizeRole } = require("../middlewares/authMiddleware");
const couponController = require("../controllers/couponController");

couponRoute.use(protect);

couponRoute.get("/coupon-list", couponController.getAllCouponWithOutPagination);
couponRoute.get("/list", couponController.getmyCoupon);

module.exports = couponRoute;
