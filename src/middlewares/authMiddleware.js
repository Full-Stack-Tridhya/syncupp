const catchAsyncErrors = require("../helpers/catchAsyncError");
const jwt = require("jsonwebtoken");
const Authentication = require("../models/authenticationSchema");
const { throwError } = require("../helpers/errorUtil");
const { returnMessage } = require("../utils/utils");
const Configuration = require("../models/configurationSchema");
const { eventEmitter } = require("../socket");
const Workspace = require("../models/workspaceSchema");
const Role_Master = require("../models/masters/roleMasterSchema");
const Gamification = require("../models/gamificationSchema");
const moment = require("moment");
const NotificationService = require("../services/notificationService");
const notificationService = new NotificationService();

exports.protect = catchAsyncErrors(async (req, res, next) => {
  const token = req.headers.authorization || req.headers.token;

  if (token) {
    const Authorization = token.split(" ")[1];
    const decodedUserData = jwt.verify(
      Authorization,
      process.env.JWT_SECRET_KEY
    );

    const [user, workspace] = await Promise.all([
      Authentication.findById(decodedUserData?.id)
        .populate("purchased_plan")
        .where("is_deleted")
        .equals("false")
        .select("-password")
        .lean(),
      Workspace.findOne({
        _id: decodedUserData?.workspace,
        is_deleted: false,
        members: {
          $elemMatch: {
            user_id: decodedUserData?.id,
            status: { $ne: "deleted" },
          },
        },
      }).lean(),
    ]);

    if (!user) return throwError(returnMessage("auth", "unAuthorized"), 401);

    if (!workspace)
      return throwError(
        returnMessage("workspace", "notAssignToWorkspace"),
        401
      );

    const req_paths = [
      "/create-subscription",
      "/order",
      "/profile",
      "/list",
      "/change-workspace",
    ];
    const workspace_creator = workspace?.members?.find(
      (member) =>
        member?.user_id?.toString() === workspace?.created_by?.toString() &&
        member?.status === "payment_pending"
    );

    if (workspace_creator?.status === "inactive")
      return throwError(returnMessage("workspace", "workspaceInactive"));

    if (
      workspace?.created_by?.toString() !== user?._id?.toString() &&
      workspace_creator?.status === "payment_pending" &&
      !["/change-workspace", "/profile", "/list"].includes(req.path)
    )
      return throwError(returnMessage("workspace", "workspacePaymentPending"));

    if (workspace_creator && !req_paths.includes(req.path)) {
      eventEmitter(
        "PAYMENT_PENDING",
        { status: "payment_pending" },
        user?._id?.toString(),
        workspace?._id?.toString()
      );
      return res.status(200).json({ success: true });
    }

    if (!workspace?.plan_selection_shown && workspace?.trial_end_date) {
      const today = moment.utc().startOf("day");
      const trial_end_date = moment
        .utc(workspace?.trial_end_date)
        .subtract(2, "days")
        .startOf("day");

      if (today.isSame(trial_end_date)) {
        this.popUpShown(user, workspace);
      }
    }
    req.user = user;

    req.user["workspace"] = decodedUserData?.workspace;
    req.user["workspace_detail"] = workspace;
    this.loginGamificationPointIncrease(user);

    next();
  } else {
    return throwError(returnMessage("auth", "unAuthorized"), 401);
  }
});

exports.authorizeRole = (requiredRole) => (req, res, next) => {
  if (req?.user?.role?.name !== requiredRole)
    return throwError(returnMessage("auth", "insufficientPermission"), 403);
  next();
};

exports.authorizeMultipleRoles = (user, requiredRoles) => (req, res, next) => {
  if (!Array.isArray(requiredRoles)) {
    return throwError(returnMessage("auth", "arrayRequired"), 403);
  }
  const userRole = user?.role;
  if (requiredRoles.includes(userRole.toString())) {
    return next();
  }
  return throwError(returnMessage("auth", "insufficientPermission"), 403);
};

// this is used for the preventing multiple login gamification points
const user_locks = {};

exports.loginGamificationPointIncrease = async (user) => {
  if (!user?.workspace) return;

  const userId = user._id.toString();
  // Check if the user is already being processed
  if (user_locks[userId]) return;

  // Set the lock for the user
  user_locks[userId] = true;
  try {
    const today = moment.utc().startOf("day");
    const workspace = await Workspace.findOne({
      _id: user?.workspace,
      is_deleted: false,
      members: {
        $elemMatch: {
          user_id: user?._id,
          status: "confirmed",
        },
      },
    }).lean();

    if (!workspace) return;
    const workspace_user_detail = workspace?.members?.find(
      (member) => member?.user_id?.toString() === user?._id?.toString()
    );

    if (!workspace_user_detail || workspace_user_detail?.status !== "confirmed")
      return;

    const [role, configuration] = await Promise.all([
      Role_Master.findById(workspace_user_detail?.role).lean(),
      Configuration.findOne({}).lean(),
    ]);

    if (role?.name !== "agency" && role?.name !== "team_agency") return;

    const last_visit_date = moment
      .utc(workspace_user_detail?.last_visit_date)
      .startOf("day");

    if (
      !last_visit_date.isSameOrAfter(today) ||
      !workspace_user_detail?.last_visit_date
    ) {
      console.log(
        `Inside of the Gamification points increase on date ${moment().format()}`
      );
      const updated_points = await Workspace.findOneAndUpdate(
        { _id: workspace?._id, "members.user_id": user?._id },
        {
          $inc: {
            "members.$.gamification_points":
              configuration?.competition.successful_login,
          },
          $set: {
            "members.$.last_visit_date": today,
          },
        },
        { new: true }
      );
      if (updated_points) {
        const gamification_points = await Gamification.create({
          user_id: user._id,
          agency_id: workspace?.created_by,
          point: +configuration?.competition?.successful_login.toString(),
          type: "login",
          role: role?._id,
          workspace_id: workspace?._id,
        });

        await notificationService.addNotification({
          module_name: "referral",
          action_type: "login",
          receiver_id: user?._id,
          points: configuration?.competition?.successful_login.toString(),
          workspace_id: workspace?._id,
          event_name: "GAMIFICATION_NOTIFICATION",
        });
      }
    }
    return;
  } catch (error) {
    console.log(`Error while increasing the gamification points: ${error}`);
  } finally {
    // Release the lock for the user
    user_locks[userId] = false;
  }
};

// this is used for the show the popup of plan selection
const plan_popup = {};
exports.popUpShown = (user, workspace) => {
  const userId = user?._id?.toString();
  // Check if the user is already being processed
  if (plan_popup[userId]) return;

  // Set the lock for the user
  plan_popup[userId] = true;
  try {
    eventEmitter(
      "PLAN_SELECTION_POPUP",
      { plan_selection_shown: false },
      user?._id?.toString(),
      workspace?._id?.toString()
    );

    Workspace.findByIdAndUpdate(workspace?._id, {
      plan_selection_shown: true,
    });
  } catch (error) {
    console.log(`Error while showing plan selection popup : ${error}`);
  } finally {
    // Release the lock for the user
    plan_popup[userId] = false;
  }
};
