const {
  protect,
  authorizeMultipleRoles,
} = require("../middlewares/authMiddleware");
const taskController = require("../controllers/taskController");
const { upload, checkFileSize } = require("../helpers/multer");
const taskRoute = require("express").Router();
taskRoute.use(protect);

// Task
taskRoute.post(
  "/create-task",
  checkFileSize,
  upload.array("attachments"),
  taskController.addTask
);
taskRoute.post("/task-list", taskController.taskList);
taskRoute.get("/get-task/:id", taskController.fetchTask);
taskRoute.delete("/delete-task", taskController.deleteTask);
taskRoute.put(
  "/update-task/:id",
  checkFileSize,
  upload.array("attachments"),
  taskController.updateTask
);
taskRoute.post("/add-comment", taskController.addTaskComment);
taskRoute.get("/list-comments/:task_id", taskController.listTaskComment);
taskRoute.post("/leave-task", taskController.leaveTask);
taskRoute.put("/update-status/:id", taskController.updateTaskStatus);

module.exports = taskRoute;
