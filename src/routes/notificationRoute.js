const notificationRoute = require("express").Router();
const notificationController = require("../controllers/notificationController");
const { protect } = require("../middlewares/authMiddleware");

notificationRoute.post("/create", notificationController.addNotification);

notificationRoute.use(protect);
notificationRoute.get("/", notificationController.getNotification);
notificationRoute.post(
  "/read-notification",
  notificationController.readNotification
);
notificationRoute.get(
  "/dashboard",
  notificationController.dashboardNotification
);
module.exports = notificationRoute;
