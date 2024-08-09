const { protect } = require("../middlewares/authMiddleware");
const activityController = require("../controllers/activityController");
const {
  createMeetMeetingValidator,
} = require("../validators/activity.validator");
const validatorFunc = require("../utils/validatorFunction.helper");
const boardController = require("../controllers/boardController");

const activityRoute = require("express").Router();

activityRoute.use(protect);

// Call Meeting & Others
activityRoute.post("/call-meeting", activityController.createCallActivity);
activityRoute.patch(
  "/update/call-meeting/:activityId",
  activityController.updateCallActivity
);
activityRoute.get("/call-meeting/:activityId", activityController.getActivity);
activityRoute.post("/list", activityController.getActivities);
activityRoute.put("/update-status/:id", activityController.updateStatus);
activityRoute.delete("/delete-activity", activityController.deleteActivity);
activityRoute.get("/get-status-list", activityController.statusList);
activityRoute.get("/fetch-users", boardController.allUserList);

// Others
activityRoute.post("/leaderboard", activityController.leaderboard);
activityRoute.post("/assigned_activity", activityController.leaderboard);
activityRoute.post("/completion_history", activityController.completionHistory);
activityRoute.get("/competitionStats", activityController.competitionStats);

module.exports = activityRoute;
