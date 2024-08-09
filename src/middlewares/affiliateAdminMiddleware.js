const catchAsyncErrors = require("../helpers/catchAsyncError");
const jwt = require("jsonwebtoken");
const { throwError } = require("../helpers/errorUtil");
const { returnMessage } = require("../utils/utils");
const Affiliate = require("../models/affiliateSchema");

exports.protect = catchAsyncErrors(async (req, res, next) => {
  const token = req.headers.authorization || req.headers.token;
  if (token) {
    const Authorization = token.split(" ")[1];
    const decodedUserData = jwt.verify(
      Authorization,
      process.env.JWT_AFFILIATE_SECRET_KEY
    );
    const user = await Affiliate.findById(decodedUserData.id)
      .where("is_deleted")
      .equals("false")
      .select("-password")
      .lean();
    if (!user) return throwError(returnMessage("auth", "unAuthorized"), 401);
    req.user = user;
    next();
  } else {
    return throwError(returnMessage("auth", "unAuthorized"), 401);
  }
});
