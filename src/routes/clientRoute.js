const clientRoute = require("express").Router();
const { protect, authorizeRole } = require("../middlewares/authMiddleware");
const clientController = require("../controllers/clientController");
const { addMemberValidator } = require("../validators/teamMember.validator");
const validatorFunc = require("../utils/validatorFunction.helper");

clientRoute.use(protect);

// Get Agencies

clientRoute.get("/get-agencies", clientController.getAgencies);

// add the team member to the workspace by the client only
clientRoute.post(
  "/team-member",
  addMemberValidator,
  validatorFunc,
  clientController.addClientTeam
);

clientRoute.delete("/delete", clientController.deleteTeamMember);

module.exports = clientRoute;
