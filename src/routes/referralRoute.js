const { protect } = require("../middlewares/authMiddleware");
const referralController = require("../controllers/referralController");
const referralRoute = require("express").Router();
referralRoute.use(protect);
referralRoute.get("/check-referral", referralController.checkRefferal);
referralRoute.get("/stats", referralController.referralStats);

module.exports = referralRoute;
