const { protect } = require("../middlewares/authMiddleware");
const {
  verify,
  login,
  add,
  deleteMember,
  getAll,
  editMember,
  getMember,
  rejectTeamMember,
} = require("../controllers/teamMemberController");
const validatorFunc = require("../utils/validatorFunction.helper");
const {
  loginTeamMemberValidator,
  addMemberValidator,
} = require("../validators/teamMember.validator");
const teamMemberRoute = require("express").Router();

// this route is used for the Team Agency Route.

teamMemberRoute.post("/verify", verify);
teamMemberRoute.post("/login", loginTeamMemberValidator, validatorFunc, login);

teamMemberRoute.use(protect);
teamMemberRoute.post("/add", addMemberValidator, validatorFunc, add);
teamMemberRoute.get("/details/:id", getMember);
teamMemberRoute.delete("/delete", deleteMember);
teamMemberRoute.post("/get-all", getAll);
teamMemberRoute.put("/edit/:id", editMember);
teamMemberRoute.patch("/reject", rejectTeamMember);

module.exports = teamMemberRoute;
