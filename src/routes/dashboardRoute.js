const dashboardRoute = require("express").Router();
const dashboardController = require("../controllers/dashboardController");
const { protect } = require("../middlewares/authMiddleware");

dashboardRoute.use(protect);
dashboardRoute.get("/", dashboardController.dashboardData);
dashboardRoute.get("/get-call-meeting", dashboardController.callMeetingList);
dashboardRoute.get("/task-list", dashboardController.listTask);

module.exports = dashboardRoute;
