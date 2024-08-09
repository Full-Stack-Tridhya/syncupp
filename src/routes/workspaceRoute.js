const { protect } = require("../middlewares/authMiddleware");
const workspaceRoute = require("express").Router();
const workspaceController = require("../controllers/workspaceController");

workspaceRoute.use(protect);
workspaceRoute.get("/list", workspaceController.workspaces);
workspaceRoute.post("/workspace-check", workspaceController.workspaceCheck);
module.exports = workspaceRoute;
