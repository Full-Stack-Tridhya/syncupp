const Task = require("../models/taskSchema");
const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const {
  returnMessage,
  paginationObject,
  getKeywordType,
  taskTemplate,
  capitalizeFirstLetter,
  returnNotification,
  replaceFields,
} = require("../utils/utils");
const moment = require("moment");
const { default: mongoose } = require("mongoose");
const sendEmail = require("../helpers/sendEmail");
const Authentication = require("../models/authenticationSchema");
const Configuration = require("../models/configurationSchema");
const NotificationService = require("./notificationService");
const notificationService = new NotificationService();
const fs = require("fs");
const Board = require("../models/boardSchema");
const Section = require("../models/sectionSchema");
const Workspace = require("../models/workspaceSchema");
const Role_Master = require("../models/masters/roleMasterSchema");
const AuthService = require("../services/authService");
const Gamification = require("../models/gamificationSchema");
const { eventEmitter } = require("../socket");
const Notification = require("../models/notificationSchema");
const Board_Status_Master = require("../models/masters/boardStatusSchema");
const authService = new AuthService();

class TaskService {
  // Create Task
  createTask = async (payload, user, files) => {
    try {
      const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
      user["role"] = user_role_data?.user_role;
      user["sub_role"] = user_role_data?.sub_role;
      if (
        user_role_data?.user_role !== "agency" &&
        user_role_data?.user_role !== "team_agency"
      ) {
        return throwError(returnMessage("auth", "insufficientPermission"));
      }

      let {
        title,
        agenda,
        due_date,
        assign_to,
        mark_as_done,
        board_id,
        priority,
        status,
        comment,
      } = payload;
      if (payload?.assign_to) {
        payload.assign_to = JSON.parse(assign_to);
      }

      const attachments = [];
      if (files && files.length > 0) {
        files.forEach((file) => {
          attachments.push({
            preview: "uploads/" + file.filename,
            name: file.originalname,
          });
        });
      }
      let agency_id;
      if (user?.role === "agency") {
        agency_id = user?._id;
      } else if (user?.role === "team_agency") {
        const workspace_data = await Workspace.findById(user?.workspace).lean();
        const agency_role_id = await Role_Master.findOne({
          name: "agency",
        }).lean();
        const find_agency = workspace_data?.members?.find(
          (user) => user.role.toString() === agency_role_id?._id.toString()
        );
        agency_id = find_agency?.user_id;
      }

      if (due_date && due_date !== "null") {
        var dueDateObject = moment(due_date);
        const duetimeObject = moment(due_date);

        var timeOnly = duetimeObject.format("HH:mm:ss");

        const currentDate = moment();
        if (!dueDateObject.isSameOrAfter(currentDate)) {
          return throwError(returnMessage("activity", "dateinvalid"));
        }
      }

      let activity_status;
      if (mark_as_done === "true") {
        const get_status = await Section.findOne({
          board_id: board_id,
          key: "completed",
        }).lean();
        activity_status = get_status?._id;
      } else {
        activity_status = payload?.status;
      }

      const status_history = [
        { status: activity_status, updated_by: user?._id },
      ];

      const create_data = {
        title,
        agenda,
        ...(due_date && due_date !== "null" && { due_time: timeOnly }),
        ...(due_date &&
          due_date !== "null" && { due_date: dueDateObject.toDate() }),
        ...(payload?.assign_to &&
          payload?.assign_to[0] && { assign_to: payload?.assign_to }),
        assign_by: user?._id,
        activity_status: activity_status,
        agency_id,
        attachments: attachments,
        board_id,
        priority,
        workspace_id: user?.workspace,
        status_history: status_history,
      };
      const newTask = new Task(create_data);
      const added_task = await newTask.save();

      const status_data = await Section.findById(activity_status)
        .select("-createdAt -updatedAt")
        .lean();

      const comment_payload = { task_id: newTask._id, comment: comment };
      if (comment) {
        this.addTaskComment(comment_payload, user);
      }
      if (payload.assign_to && payload.assign_to[0]) {
        const board = await Board.findById(payload?.board_id).lean();
        // ----------------------- Notification Start -----------------------
        const configuration = await Configuration.findOne({}).lean();
        const link = `${process.env.REACT_APP_URL}/${user?.workspace_detail?.name}/tasks/board/${board?._id}`;
        var indianTimeZone = dueDateObject?.tz("Asia/Kolkata").format("HH:mm");
        payload?.assign_to &&
          payload?.assign_to[0] &&
          payload?.assign_to.forEach(async (user_id) => {
            const user_data = await Authentication.findById(user_id).lean();

            let data = {
              TaskTitle: "New Task Created",
              taskName: capitalizeFirstLetter(title),
              status: capitalizeFirstLetter(status?.name),
              assign_by:
                capitalizeFirstLetter(user?.first_name) +
                " " +
                capitalizeFirstLetter(user?.last_name),
              dueDate:
                due_date !== undefined
                  ? moment(dueDateObject)?.format("DD/MM/YYYY")
                  : "-",
              dueTime: due_date !== undefined ? indianTimeZone : "",
              agginTo_email: user_data?.email,
              assignName:
                capitalizeFirstLetter(user_data?.first_name) +
                " " +
                capitalizeFirstLetter(user_data?.last_name),
              board_name: board
                ? capitalizeFirstLetter(board?.project_name)
                : "",
              board_id: board ? board?._id : "",
              status_name: status_data?.section_name,
              workspace_name: user?.workspace_detail?.name,
              priority: priority,
              REACT_APP_URL: process.env.REACT_APP_URL,
              SERVER_URL: process.env.SERVER_URL,
              link: link,
              instagram: configuration?.urls?.instagram,
              facebook: configuration?.urls?.facebook,
              privacy_policy: configuration?.urls?.privacy_policy,
              year: new Date().getFullYear(),
            };

            const taskMessage = taskTemplate(data);
            sendEmail({
              email: user_data?.email,
              subject: returnMessage("activity", "createSubject"),
              message: taskMessage,
            });
            if (user?.role === "agency" || user?.role === "team_agency") {
              await notificationService.addNotification(
                {
                  assign_by: user?._id,
                  assigned_by_name: user?.first_name + " " + user?.last_name,
                  assigned_to_name:
                    user_data?.first_name + " " + user_data?.last_name,
                  ...payload,
                  module_name: "task",
                  activity_type_action: "createTask",
                  activity_type: "task",
                  due_time:
                    due_date !== undefined
                      ? moment(due_date).format("HH:mm")
                      : "-",
                  due_date:
                    due_date !== undefined
                      ? moment(due_date).format("DD-MM-YYYY")
                      : "-",
                  board_name: board ? board?.project_name : "",
                  board_id: board ? board?._id : "",
                  assign_to: user_data?._id,
                  workspace_id: user?.workspace,
                  status_name: status_data?.section_name,
                  comment_count: comment ? "1" : "0",
                },
                added_task?._id
              );
            }
          });

        // ----------------------- Notification END -----------------------
      }

      return {
        ...added_task?._doc,
        status: status_data,
        comment: comment ? 1 : 0,
      };
    } catch (error) {
      logger.error(`Error while creating task : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Task List
  taskList = async (searchObj, user) => {
    const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
    user["role"] = user_role_data?.user_role;
    user["sub_role"] = user_role_data?.sub_role;

    // Validate board_id
    if (!mongoose.Types.ObjectId.isValid(searchObj?.board_id)) {
      return throwError(returnMessage("board", "invalidBoardId"));
    }
    const board_data = await Board.findById(searchObj?.board_id).lean();

    if (!board_data) {
      return throwError(returnMessage("board", "boardNotFound"));
    }

    if (!searchObj.pagination)
      return await this.taskListWithOutPaination(searchObj, user);
    try {
      let queryObj;
      if (user?.role === "agency") {
        queryObj = {
          is_deleted: false,
          workspace_id: new mongoose.Types.ObjectId(user?.workspace),
        };
      } else if (user?.role === "client") {
        queryObj = {
          is_deleted: false,
          assign_to: user?._id,
          workspace_id: new mongoose.Types.ObjectId(user?.workspace),
        };
      } else if (user?.role === "team_agency") {
        if (user?.sub_role === "admin") {
          queryObj = {
            is_deleted: false,
            $or: [{ assign_by: user?._id }, { assign_to: user?._id }],
            workspace_id: new mongoose.Types.ObjectId(user?.workspace),
          };
        } else if (user?.sub_role === "team_member") {
          queryObj = {
            is_deleted: false,
            $or: [{ assign_by: user?._id }, { assign_to: user?._id }],
            workspace_id: new mongoose.Types.ObjectId(user?.workspace),
          };
        }
      } else if (user?.role === "team_client") {
        queryObj = {
          is_deleted: false,
          assign_to: user?._id,
          workspace_id: new mongoose.Types.ObjectId(user?.workspace),
        };
      }
      const pagination = paginationObject(searchObj);
      const filter = {
        $match: {},
      };

      const completed_section = await Section.findOne({
        board_id: searchObj?.board_id,
        key: "completed",
      })
        .select("_id")
        .lean();
      const archived_section = await Section.findOne({
        board_id: searchObj?.board_id,
        key: "archived",
      })
        .select("_id")
        .lean();

      if (searchObj?.filter) {
        if (searchObj?.filter === "completed") {
          filter["$match"] = {
            ...filter["$match"],
            activity_status: completed_section?._id,
            is_deleted: false,
          };
        }
        if (searchObj?.filter === "archived") {
          filter["$match"] = {
            ...filter["$match"],
            mark_as_archived: true,
            is_deleted: false,
          };
        }
        if (searchObj?.filter === "overdue") {
          const currentUtcDate = moment().utc();
          filter["$match"] = {
            ...filter["$match"],
            is_deleted: false,
            due_date: {
              $lt: currentUtcDate.toDate(),
            },
            activity_status: {
              $nin: [completed_section?._id, archived_section?._id],
            },
          };
        }
        if (searchObj?.filter === "in_completed") {
          filter["$match"] = {
            ...filter["$match"],
            activity_status: {
              $nin: [completed_section?._id, archived_section?._id],
            },
            is_deleted: false,
          };
        }
        if (searchObj?.filter === "my_task") {
          filter["$match"] = {
            ...filter["$match"],
            assign_to: user?._id,
            is_deleted: false,
            activity_status: {
              $nin: [archived_section?._id],
            },
          };
        }
        // Filter for tasks due this week
        if (searchObj?.filter === "due_this_week") {
          const startOfWeek = moment().startOf("week").utc().toDate();
          const endOfWeek = moment().endOf("week").utc().toDate();
          filter["$match"] = {
            ...filter["$match"],
            due_date: { $gte: startOfWeek, $lte: endOfWeek },
            is_deleted: false,
            activity_status: {
              $nin: [completed_section?._id, archived_section?._id],
            },
          };
        }
        // Filter for tasks due next week
        if (searchObj?.filter === "due_next_week") {
          const startOfNextWeek = moment()
            .add(1, "week")
            .startOf("week")
            .utc()
            .toDate();
          const endOfNextWeek = moment()
            .add(1, "week")
            .endOf("week")
            .utc()
            .toDate();
          filter["$match"] = {
            ...filter["$match"],
            due_date: { $gte: startOfNextWeek, $lte: endOfNextWeek },
            is_deleted: false,
            activity_status: {
              $nin: [completed_section?._id, archived_section?._id],
            },
          };
        }
      } else {
        filter["$match"] = {
          ...filter["$match"],
          mark_as_archived: false,
          is_deleted: false,
        };
      }

      // Filter for tasks due next week
      if (searchObj?.assignee_id) {
        filter["$match"] = {
          ...filter["$match"],
          assign_to: new mongoose.Types.ObjectId(searchObj?.assignee_id),
        };
      }

      if (searchObj.search && searchObj.search !== "") {
        queryObj["$or"] = [
          {
            title: {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            priority: {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "status.section_name": {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
          // {
          //   "team_by.first_name": {
          //     $regex: searchObj?.search.toLowerCase(),
          //     $options: "i",
          //   },
          // },
          // {
          //   "team_by.last_name": {
          //     $regex: searchObj?.search.toLowerCase(),
          //     $options: "i",
          //   },
          // },
          // {
          //   "team_by.assigned_by_name": {
          //     $regex: searchObj?.search.toLowerCase(),
          //     $options: "i",
          //   },
          // },
          {
            "team_data.first_name": {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "team_data.last_name": {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            "team_data.assignee_by_name": {
              $regex: searchObj?.search.toLowerCase(),
              $options: "i",
            },
          },
        ];
      }
      const taskPipeline = [
        {
          $match: {
            board_id: new mongoose.Types.ObjectId(searchObj?.board_id),
            is_deleted: false,
          },
        },
        filter,
        {
          $lookup: {
            from: "authentications",
            let: { assign_to_ids: "$assign_to" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$assign_to_ids"],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  profile_image: 1,
                  assignee_by_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
            as: "team_data",
          },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "assign_by",
            foreignField: "_id",
            as: "team_by",
            pipeline: [
              {
                $project: {
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  assigned_by_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$team_by", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "sections",
            localField: "activity_status",
            foreignField: "_id",
            as: "status",
            pipeline: [{ $project: { createdAt: 0, updatedAt: 0 } }],
          },
        },
        {
          $unwind: { path: "$status", preserveNullAndEmptyArrays: true },
        },
        {
          $match: queryObj,
        },
        {
          $project: {
            contact_number: 1,
            activity_status: 1,
            title: 1,
            status: "$status",
            due_time: 1,
            assign_to: "$team_data",
            due_date: 1,
            createdAt: 1,
            agenda: 1,
            assign_by: 1,
            assigned_by_first_name: "$team_by.first_name",
            assigned_by_last_name: "$team_by.last_name",
            assigned_by_name: "$team_by.assigned_by_name",
            column_id: "$status.name",
            agency_id: 1,
            board_id: 1,
            priority: 1,
            mark_as_done: 1,
            mark_as_archived: 1,
            workspace_id: 1,
          },
        },
      ];

      // Conditionally add the $sort stage
      if (searchObj.sort_field === "status") {
        const sortOrder = searchObj.sort_order === "desc" ? -1 : 1;
        taskPipeline.push({
          $sort: { "status.section_name": sortOrder },
        });
      }

      const activity = await Task.aggregate(taskPipeline)
        .sort(pagination.sort)
        .skip(pagination.skip)
        .limit(pagination.result_per_page);

      const totalAgreementsCount = await Task.aggregate(taskPipeline);

      // Calculating total pages
      const pages = Math.ceil(
        totalAgreementsCount.length / pagination.result_per_page
      );

      return {
        activity,
        page_count: pages,
      };
    } catch (error) {
      logger.error(`Error while fetch list : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Task List with pagination
  taskListWithOutPaination = async (searchObj, user) => {
    try {
      if (searchObj?.section_id) {
        return this.taskDataSectionWise(searchObj, user);
      }
      // Validate board_id
      if (!mongoose.Types.ObjectId.isValid(searchObj?.board_id)) {
        return throwError(returnMessage("board", "invalidBoardId"));
      }

      const board_data = await Board.findById(searchObj?.board_id).lean();

      if (!board_data) {
        return throwError(returnMessage("board", "boardNotFound"));
      }

      let queryObj;
      if (user?.role === "agency") {
        queryObj = {
          is_deleted: false,
          workspace_id: new mongoose.Types.ObjectId(user?.workspace),
        };
      } else if (user?.role === "client") {
        queryObj = {
          is_deleted: false,
          assign_to: user?._id,
          workspace_id: new mongoose.Types.ObjectId(user?.workspace),
        };
      } else if (user?.role === "team_agency") {
        if (user?.sub_role === "admin") {
          queryObj = {
            is_deleted: false,
            $or: [{ assign_by: user?._id }, { assign_to: user?._id }],
            workspace_id: new mongoose.Types.ObjectId(user?.workspace),
          };
        } else if (user?.sub_role === "team_member") {
          queryObj = {
            is_deleted: false,
            $or: [{ assign_by: user?._id }, { assign_to: user?._id }],
            workspace_id: new mongoose.Types.ObjectId(user?.workspace),
          };
        }
      } else if (user?.role === "team_client") {
        queryObj = {
          is_deleted: false,
          assign_to: user?._id,
          workspace_id: new mongoose.Types.ObjectId(user?.workspace),
        };
      }
      const filter = {
        $match: {},
      };

      const completed_section = await Section.findOne({
        board_id: searchObj?.board_id,
        key: "completed",
      })
        .select("_id")
        .lean();
      const archived_section = await Section.findOne({
        board_id: searchObj?.board_id,
        key: "archived",
      })
        .select("_id")
        .lean();

      if (searchObj?.filter) {
        if (searchObj?.filter === "completed") {
          filter["$match"] = {
            ...filter["$match"],
            activity_status: completed_section?._id,
            is_deleted: false,
          };
        }
        if (searchObj?.filter !== "archived") {
          filter["$match"] = {
            ...filter["$match"],
            mark_as_archived: false,
            is_deleted: false,
          };
        }
        if (searchObj?.filter === "archived") {
          filter["$match"] = {
            ...filter["$match"],
            mark_as_archived: true,
            is_deleted: false,
          };
        }
        if (searchObj?.filter === "overdue") {
          const currentUtcDate = moment().utc();
          filter["$match"] = {
            ...filter["$match"],
            is_deleted: false,
            due_date: {
              $lt: currentUtcDate.toDate(),
            },
            activity_status: {
              $nin: [completed_section?._id, archived_section?._id],
            },
          };
        }
        if (searchObj?.filter === "in_completed") {
          filter["$match"] = {
            ...filter["$match"],
            activity_status: {
              $nin: [completed_section?._id, archived_section?._id],
            },
            is_deleted: false,
          };
        }
        if (searchObj?.filter === "my_task") {
          filter["$match"] = {
            ...filter["$match"],
            assign_to: user?._id,
            is_deleted: false,
            activity_status: {
              $nin: [archived_section?._id],
            },
          };
        }
        // Filter for tasks due this week
        if (searchObj?.filter === "due_this_week") {
          const startOfWeek = moment().startOf("week").utc().toDate();
          const endOfWeek = moment().endOf("week").utc().toDate();
          filter["$match"] = {
            ...filter["$match"],
            due_date: { $gte: startOfWeek, $lte: endOfWeek },
            is_deleted: false,
            activity_status: {
              $nin: [completed_section?._id, archived_section?._id],
            },
          };
        }
        // Filter for tasks due next week
        if (searchObj?.filter === "due_next_week") {
          const startOfNextWeek = moment()
            .add(1, "week")
            .startOf("week")
            .utc()
            .toDate();
          const endOfNextWeek = moment()
            .add(1, "week")
            .endOf("week")
            .utc()
            .toDate();
          filter["$match"] = {
            ...filter["$match"],
            due_date: { $gte: startOfNextWeek, $lte: endOfNextWeek },
            is_deleted: false,
            activity_status: {
              $nin: [completed_section?._id, archived_section?._id],
            },
          };
        }
      } else {
        filter["$match"] = {
          ...filter["$match"],
          mark_as_archived: false,
          is_deleted: false,
        };
      }

      // Filter for tasks due next week
      if (searchObj?.assignee_id) {
        filter["$match"] = {
          ...filter["$match"],
          assign_to: new mongoose.Types.ObjectId(searchObj?.assignee_id),
        };
      }

      const taskPipeline = [
        {
          $match: {
            board_id: new mongoose.Types.ObjectId(searchObj?.board_id),
            is_deleted: false,
          },
        },
        filter,
        {
          $lookup: {
            from: "authentications",
            let: { assign_to_ids: "$assign_to" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$assign_to_ids"],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  profile_image: 1,
                },
              },
            ],
            as: "team_data",
          },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "assign_by_data",
            foreignField: "_id",
            as: "assign_by_data",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  assigned_by_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$assign_by_data",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "sections",
            localField: "activity_status",
            foreignField: "_id",
            as: "status",
            pipeline: [{ $project: { createdAt: 0, updatedAt: 0 } }],
          },
        },
        {
          $unwind: { path: "$status", preserveNullAndEmptyArrays: true },
        },

        {
          $match: queryObj,
        },
        {
          $project: {
            contact_number: 1,
            title: 1,
            status: "$status",
            due_time: 1,
            due_date: 1,
            createdAt: 1,
            updatedAt: 1,
            agenda: 1,
            assign_to: "$team_data",
            assigned_by_first_name: "$assign_by_data.first_name",
            assigned_by_last_name: "$assign_by_data.last_name",
            assigned_by_name: "$assign_by_data.assigned_by_name",
            assign_by: 1,
            column_id: "$status.name",
            board_id: 1,
            priority: 1,
            attachment_count: { $size: "$attachments" },
            comments_count: { $size: "$comments" },
            mark_as_done: 1,
            mark_as_archived: 1,
            workspace_id: 1,
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
        {
          $group: {
            _id: "$status.section_name",
            data: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            data: { $slice: ["$data", searchObj?.task_count || 10] },
          },
        },
        {
          $unwind: { path: "$data", preserveNullAndEmptyArrays: true },
        },
        {
          $replaceRoot: { newRoot: "$data" },
        },
      ];

      const activity = await Task.aggregate(taskPipeline);

      const taskCountPipeline = [
        filter,
        {
          $lookup: {
            from: "sections",
            localField: "activity_status",
            foreignField: "_id",
            as: "status",
            pipeline: [{ $project: { createdAt: 0, updatedAt: 0 } }],
          },
        },
        {
          $unwind: { path: "$status", preserveNullAndEmptyArrays: true },
        },

        {
          $match: {
            ...queryObj,
            board_id: new mongoose.Types.ObjectId(searchObj?.board_id),
            is_deleted: false,
            "status.is_deleted": false,
          },
        },
        {
          $group: {
            _id: "$status._id", // Group by status
            count: { $sum: 1 }, // Count documents for each status
          },
        },
      ];

      const find_section_list = await Section.distinct("_id", {
        board_id: searchObj?.board_id,
      });

      const task_counts = await Task.aggregate(taskCountPipeline).sort({
        updatedAt: -1,
      });

      const new_data = Array.from(find_section_list)
        .filter(
          (section) =>
            !task_counts.some(
              (item) => item._id.toString() === section.toString()
            )
        )
        .map((section) => ({ _id: section.toString(), count: 0 }));

      return {
        activity,
        task_counts: [...new_data, ...task_counts],
      };
    } catch (error) {
      logger.error(`Error while fetch list : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Task Data SectionWise
  taskDataSectionWise = async (searchObj, user) => {
    try {
      let queryObj;
      if (user?.role === "agency") {
        queryObj = {
          is_deleted: false,
          workspace_id: new mongoose.Types.ObjectId(user?.workspace),
        };
      } else if (user?.role === "client") {
        queryObj = {
          is_deleted: false,
          assign_to: user?._id,
        };
      } else if (user?.role === "team_agency") {
        if (user?.sub_role === "admin") {
          queryObj = {
            workspace_id: new mongoose.Types.ObjectId(user?.workspace),
            is_deleted: false,
          };
        } else if (user?.sub_role === "team_member") {
          queryObj = {
            is_deleted: false,
            $or: [{ assign_by: user?._id }, { assign_to: user?._id }],
          };
        }
      } else if (user?.role === "team_client") {
        queryObj = {
          is_deleted: false,
          assign_to: user?._id,
        };
      }
      const filter = {
        $match: {},
      };

      const completed_section = await Section.findOne({
        board_id: searchObj?.board_id,
        key: "completed",
      })
        .select("_id")
        .lean();
      const archived_section = await Section.findOne({
        board_id: searchObj?.board_id,
        key: "archived",
      })
        .select("_id")
        .lean();

      if (searchObj?.filter) {
        if (searchObj?.filter === "completed") {
          filter["$match"] = {
            ...filter["$match"],
            activity_status: completed_section?._id,
            is_deleted: false,
          };
        }
        if (searchObj?.filter !== "archived") {
          filter["$match"] = {
            ...filter["$match"],
            mark_as_archived: false,
            is_deleted: false,
          };
        }
        if (searchObj?.filter === "archived") {
          filter["$match"] = {
            ...filter["$match"],
            mark_as_archived: true,
            is_deleted: false,
          };
        }
        if (searchObj?.filter === "overdue") {
          const currentUtcDate = moment().utc();
          filter["$match"] = {
            ...filter["$match"],
            is_deleted: false,
            due_date: {
              $lt: currentUtcDate.toDate(),
            },
            activity_status: {
              $nin: [completed_section?._id, archived_section?._id],
            },
          };
        }
        if (searchObj?.filter === "in_completed") {
          filter["$match"] = {
            ...filter["$match"],
            activity_status: {
              $nin: [completed_section?._id, archived_section?._id],
            },
            is_deleted: false,
          };
        }
        if (searchObj?.filter === "my_task") {
          filter["$match"] = {
            ...filter["$match"],
            assign_to: user?._id,
            is_deleted: false,
            activity_status: {
              $nin: [archived_section?._id],
            },
          };
        }
        // Filter for tasks due this week
        if (searchObj?.filter === "due_this_week") {
          const startOfWeek = moment().startOf("week").utc().toDate();
          const endOfWeek = moment().endOf("week").utc().toDate();
          filter["$match"] = {
            ...filter["$match"],
            due_date: { $gte: startOfWeek, $lte: endOfWeek },
            is_deleted: false,
            activity_status: {
              $nin: [completed_section?._id, archived_section?._id],
            },
          };
        }
        // Filter for tasks due next week
        if (searchObj?.filter === "due_next_week") {
          const startOfNextWeek = moment()
            .add(1, "week")
            .startOf("week")
            .utc()
            .toDate();
          const endOfNextWeek = moment()
            .add(1, "week")
            .endOf("week")
            .utc()
            .toDate();
          filter["$match"] = {
            ...filter["$match"],
            due_date: { $gte: startOfNextWeek, $lte: endOfNextWeek },
            is_deleted: false,
            activity_status: {
              $nin: [completed_section?._id, archived_section?._id],
            },
          };
        }
      } else {
        filter["$match"] = {
          ...filter["$match"],
          mark_as_archived: false,
          is_deleted: false,
        };
      }
      const taskPipeline = [
        {
          $match: {
            board_id: new mongoose.Types.ObjectId(searchObj?.board_id),
            is_deleted: false,
            activity_status: new mongoose.Types.ObjectId(searchObj?.section_id),
          },
        },
        filter,
        {
          $lookup: {
            from: "authentications",
            let: { assign_to_ids: "$assign_to" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$assign_to_ids"],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  profile_image: 1,
                },
              },
            ],
            as: "team_data",
          },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "assign_by",
            foreignField: "_id",
            as: "assign_by_data",
            pipeline: [
              {
                $project: {
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  assigned_by_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$assign_by_data",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "sections",
            localField: "activity_status",
            foreignField: "_id",
            as: "status",
            pipeline: [{ $project: { createdAt: 0, updatedAt: 0 } }],
          },
        },
        {
          $unwind: { path: "$status", preserveNullAndEmptyArrays: true },
        },

        {
          $match: queryObj,
        },
        {
          $project: {
            contact_number: 1,
            title: 1,
            status: "$status",
            due_time: 1,
            due_date: 1,
            createdAt: 1,
            updatedAt: 1,
            agenda: 1,
            assign_to: "$team_data",
            assigned_by_first_name: "$assign_by_data.first_name",
            assigned_by_last_name: "$assign_by_data.last_name",
            assigned_by_name: "$assign_by_data.assigned_by_name",
            column_id: "$status.name",
            board_id: 1,
            priority: 1,
            attachment_count: { $size: "$attachments" },
            comments_count: { $size: "$comments" },
            mark_as_done: 1,
            mark_as_archived: 1,
            workspace_id: 1,
            assign_by: 1,
          },
        },
      ];

      const activity = await Task.aggregate(taskPipeline)
        .sort({ updatedAt: -1 })
        .skip(searchObj.skip)
        .limit(searchObj.limit);

      return {
        activity,
        // page_count: pages,
      };
    } catch (error) {
      logger.error(`Error while fetch list : ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Get Task By ID
  getTaskById = async (id, user) => {
    try {
      const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
      user["role"] = user_role_data?.user_role;
      user["sub_role"] = user_role_data?.sub_role;

      const is_task_exist = await Task.findOne({
        _id: id,
      })
        .populate("board_id", "is_deleted")
        .lean();

      if (is_task_exist?.board_id?.is_deleted || is_task_exist.is_deleted) {
        return throwError(returnMessage("activity", "taskNotExist"));
      }

      const is_assignee = await Task.findOne({
        _id: id,
        $or: [{ assign_by: user?._id }, { assign_to: user?._id }],
      }).lean();

      if (!is_assignee && user_role_data?.user_role !== "agency") {
        return throwError(returnMessage("activity", "taskNotAvailable"));
      }

      const taskPipeline = [
        {
          $lookup: {
            from: "authentications",
            let: { assign_to_ids: "$assign_to" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$assign_to_ids"],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  first_name: 1,
                  last_name: 1,
                  profile_image: 1,
                },
              },
            ],
            as: "team_data",
          },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "assign_by",
            foreignField: "_id",
            as: "assign_by",
            pipeline: [
              {
                $project: {
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  assigned_by_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$assign_by", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "sections",
            localField: "activity_status",
            foreignField: "_id",
            as: "status",
            pipeline: [{ $project: { section_name: 1 } }],
          },
        },
        {
          $unwind: { path: "$status", preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            is_deleted: false,
          },
        },
        {
          $project: {
            title: 1,
            due_time: 1,
            due_date: 1,
            createdAt: 1,
            status: "$status",
            agenda: 1,
            assigned_by_name: "$assign_by.name",
            assigned_by_first_name: "$assign_by.first_name",
            assigned_by_last_name: "$assign_by.last_name",
            assigned_by_name: "$assigned_by_name",
            attachments: 1,
            internal_info: 1,
            assign_to: "$team_data",
            priority: 1,
            board_id: 1,
            mark_as_done: 1,
            mark_as_archived: 1,
            workspace_id: 1,
          },
        },
      ];
      const activity = await Task.aggregate(taskPipeline);

      return activity;
    } catch (error) {
      logger.error(`Error while fetching data: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Delete Task Notification
  deleteTask = async (payload, user) => {
    const { taskIdsToDelete } = payload;
    try {
      const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
      user["role"] = user_role_data?.user_role;
      user["sub_role"] = user_role_data?.sub_role;
      if (
        user_role_data?.user_role !== "agency" &&
        user_role_data?.user_role !== "team_agency"
      ) {
        return throwError(returnMessage("auth", "insufficientPermission"));
      }

      await Task.updateMany(
        { _id: { $in: taskIdsToDelete } },
        { $set: { is_deleted: true } }
      );

      this.deleteTaskNotification(payload, user);

      return;
    } catch (error) {
      logger.error(`Error while Deleting task, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Delete Task Notifications
  deleteTaskNotification = async (payload, user) => {
    const { taskIdsToDelete } = payload;
    try {
      const pipeline = [
        {
          $lookup: {
            from: "authentications",
            let: { assign_to_ids: "$assign_to" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$assign_to_ids"],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  email: 1,
                  assigned_to_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
            as: "team_data",
          },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "assign_by",
            foreignField: "_id",
            as: "assign_by",
            pipeline: [
              {
                $project: {
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  assigned_by_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },

        {
          $unwind: { path: "$assign_by", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "sections",
            localField: "activity_status",
            foreignField: "_id",
            as: "status",
            pipeline: [{ $project: { section_name: 1 } }],
          },
        },
        {
          $unwind: { path: "$status", preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            _id: {
              $in: taskIdsToDelete.map((id) => new mongoose.Types.ObjectId(id)),
            },
          },
        },
        {
          $project: {
            agenda: 1,
            status: "$status",
            assigned_by_first_name: "$assign_by.first_name",
            assigned_by_last_name: "$assign_by.last_name",
            assigned_by_name: "$assign_by.assigned_by_name",
            column_id: "$status.name",
            assign_to: "$team_data",
            due_date: 1,
            due_time: 1,
            title: 1,
            board_id: 1,
            priority: 1,
          },
        },
      ];
      const getTask = await Task.aggregate(pipeline);
      getTask.forEach(async (task) => {
        const board = await Board.findById(task?.board_id).lean();
        const configuration = await Configuration.findOne({}).lean();
        const link = `${process.env.REACT_APP_URL}/${user?.workspace_detail?.name}/tasks/board/${board?._id}`;
        task?.assign_to?.forEach(async (member) => {
          let data = {
            TaskTitle: "Deleted Task",
            taskName: task?.title,
            status_name: task?.status?.section_name,
            assign_by: task?.assigned_by_name,
            dueDate: task?.due_date
              ? moment(task?.due_date).format("DD/MM/YYYY")
              : "-",
            dueTime: task?.due_time ?? "-",
            agginTo_email: member?.email,
            priority: task?.priority,
            assignName: member?.assigned_to_name,
            board_name: board ? board?.project_name : "",
            REACT_APP_URL: process.env.REACT_APP_URL,
            SERVER_URL: process.env.SERVER_URL,
            link: link,
            instagram: configuration?.urls?.instagram,
            facebook: configuration?.urls?.facebook,
            privacy_policy: configuration?.urls?.privacy_policy,
            year: new Date().getFullYear(),
          };
          const taskMessage = taskTemplate(data);
          await sendEmail({
            email: member?.email,
            subject: returnMessage("activity", "taskDeleted"),
            message: taskMessage,
          });
          await notificationService.addNotification(
            {
              title: task?.title,
              module_name: "task",
              activity_type_action: "deleted",
              activity_type: "task",
              assign_to: member?._id,
              workspace_id: user?.workspace,
              board_name: board ? board?.project_name : "",
              board_id: board ? board?._id : "",
            },
            task?._id
          );
          return;
        });
      });

      return;
    } catch (error) {
      logger.error(`Error while Deleting task, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Update Task
  updateTask = async (payload, id, files, user) => {
    try {
      const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
      user["role"] = user_role_data?.user_role;
      user["sub_role"] = user_role_data?.sub_role;
      if (
        user_role_data?.user_role !== "agency" &&
        user_role_data?.user_role !== "team_agency"
      ) {
        return throwError(returnMessage("auth", "insufficientPermission"));
      }

      if (payload?.action_name === "date_assignee_update") {
        return this.updateDateAssigneeTask(payload, id, user);
      }
      if (!payload?.status) {
        return throwError(returnMessage("activity", "statusRequired"));
      }
      let {
        title,
        agenda,
        due_date,
        assign_to,
        mark_as_done,
        priority,
        status,
        board_id,
        comment,
      } = payload;
      const status_check = await Task.findById(id).populate("activity_status");
      if (status_check?.activity_status?.name === "completed") {
        return throwError(returnMessage("activity", "CannotUpdate"));
      }
      const attachments = [];
      if (files && files.length > 0) {
        files.forEach((file) => {
          attachments.push({
            preview: "uploads/" + file.filename,
            name: file.filename,
          });
        });
      }

      const removed_attachments = [];
      let objects = [];
      // Check if attachments is an array and parse each item
      if (Array.isArray(payload.attachments)) {
        objects = payload.attachments.map((item) => JSON.parse(item));
      }
      // Check if attachments is a string and parse it
      else if (typeof payload.attachments === "string") {
        objects = [JSON.parse(payload.attachments)];
      }

      // Assuming status_check is a predefined variable containing attachments to compare against
      for (const attachment of status_check?.attachments || []) {
        const is_include = objects.find(
          (existingAttachment) =>
            existingAttachment._id.toString() === attachment._id.toString()
        );
        if (!is_include) {
          removed_attachments.push({
            _id: new mongoose.Types.ObjectId(attachment?._id),
            preview: attachment?.preview,
          });
        }
      }

      removed_attachments && removed_attachments[0];
      removed_attachments.map((item) => {
        fs.unlink(`./src/public/${item.preview}`, (err) => {
          if (err) {
            logger.error(`Error while unlinking the documents: ${err}`);
          }
        });
      });

      if (due_date && due_date !== "null") {
        var dueDateObject = moment(due_date);
        const duetimeObject = moment(due_date);

        let updatedData = await Task.findById(id).lean();
        var timeOnly = duetimeObject.format("HH:mm:ss");

        const currentDate = moment();
        let check_due_date = moment(updatedData.due_date);
        if (!check_due_date.isSame(dueDateObject)) {
          if (!dueDateObject.isSameOrAfter(currentDate)) {
            return throwError(returnMessage("activity", "dateinvalid"));
          }
        }
      }

      const get_complete_status = await Section.findOne({
        board_id: board_id,
        key: "completed",
      }).lean();
      let activity_status;
      if (mark_as_done === "true") {
        activity_status = get_complete_status?._id;
      } else {
        activity_status = payload?.status;
      }

      const status_data = await Section.findById(payload?.status)
        .select("-createdAt -updatedAt")
        .lean();

      if (payload?.assign_to) {
        payload.assign_to = JSON.parse(assign_to);
      }

      const status_history = [
        { status: payload?.status, updated_by: user?._id },
      ];

      status_check.attachments.push(...attachments);
      await status_check.save();

      // const current_activity = await Task.findById(id).lean();
      let updateTasksPayload = {
        title,
        agenda,
        ...(due_date && due_date !== "null" && { due_time: timeOnly }),
        ...(due_date &&
          due_date !== "null" && { due_date: dueDateObject.toDate() }),
        ...(payload?.assign_to &&
          payload?.assign_to[0] && { assign_to: payload?.assign_to }),
        ...(!payload?.assign_to && { assign_to: [] }),
        activity_status: activity_status,

        priority,
        ...(mark_as_done && mark_as_done === "true" && { mark_as_done: true }),
        ...(payload?.status &&
          payload?.status.toString() ===
            get_complete_status?._id.toString() && { mark_as_done: true }),
        ...(payload?.status &&
          status_check.activity_status._id.toString() !==
            payload?.status.toString() && {
            $push: { status_history: status_history },
          }),
        ...(removed_attachments?.length > 0 && {
          $pull: {
            attachments: {
              $or: removed_attachments,
            },
          },
        }),
        ...(due_date && due_date === "null" && { due_time: "" }),
        ...(due_date && due_date === "null" && { due_date: "" }),
      };

      const updateTasks = await Task.findByIdAndUpdate(id, updateTasksPayload, {
        new: true,
        useFindAndModify: false,
      });
      const comment_payload = { task_id: id, comment: comment };

      if (comment) {
        this.addTaskComment(comment_payload, user);
      }

      const pipeline = [
        {
          $lookup: {
            from: "authentications",
            let: { assign_to_ids: "$assign_to" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$assign_to_ids"],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  first_name: 1,
                  last_name: 1,
                  profile_image: 1,
                },
              },
            ],
            as: "team_data",
          },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "assign_by",
            foreignField: "_id",
            as: "assign_by",
            pipeline: [
              {
                $project: {
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  assigned_by_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$assign_by", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "sections",
            localField: "activity_status",
            foreignField: "_id",
            as: "statusName",
          },
        },
        {
          $unwind: { path: "$statusName", preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            is_deleted: false,
          },
        },
        {
          $project: {
            agenda: 1,
            assigned_by_first_name: "$assign_by.first_name",
            assigned_by_last_name: "$assign_by.last_name",
            assigned_to_first_name: "$team_data.first_name",
            assigned_to_last_name: "$team_data.last_name",
            assigned_to_name: "$team_data.assigned_to_name",
            assigned_by_name: "$assign_by.assigned_by_name",
            client_name: "$client_Data.client_name",
            column_id: "$status.name",
            assign_email: "$team_data.email",
            agency_id: 1,
            status_name: "$statusName.section_name",
            board_id: 1,
            comments_count: { $size: "$comments" },
            priority: 1,
          },
        },
      ];
      const getTask = await Task.aggregate(pipeline);
      const board = await Board.findById(getTask[0]?.board_id).lean();
      const configuration = await Configuration.findOne({}).lean();
      const link = `${process.env.REACT_APP_URL}/${user?.workspace_detail?.name}/tasks/board/${board?._id}`;
      payload?.assign_to &&
        payload?.assign_to[0] &&
        payload?.assign_to.forEach(async (user_id) => {
          var user_data = await Authentication.findById(user_id).lean();

          let data = {
            TaskTitle: "Updated Task ",
            taskName: title,
            status:
              payload?.mark_as_done === "true"
                ? "Completed"
                : getTask[0]?.status_name,
            assign_by: capitalizeFirstLetter(getTask[0]?.assigned_by_name),
            dueDate: moment(dueDateObject)?.format("DD/MM/YYYY"),
            dueTime: timeOnly,
            agginTo_email: user_data?.email,
            assignName:
              capitalizeFirstLetter(user_data?.first_name) +
              " " +
              capitalizeFirstLetter(user_data?.last_name),
            board_name: board ? board?.project_name : "",
            board_id: board ? board?._id : "",
            status_name: getTask[0]?.status_name,
            workspace_name: user?.workspace_detail?.name,
            priority: getTask[0].priority,
            REACT_APP_URL: process.env.REACT_APP_URL,
            SERVER_URL: process.env.SERVER_URL,
            link: link,
            instagram: configuration?.urls?.instagram,
            facebook: configuration?.urls?.facebook,
            privacy_policy: configuration?.urls?.privacy_policy,
            year: new Date().getFullYear(),
          };
          const taskMessage = taskTemplate(data);
          sendEmail({
            email: user_data?.email,
            subject: returnMessage("activity", "UpdateSubject"),
            message: taskMessage,
          });

          // -------------- Socket notification start --------------------

          let taskAction = "update";
          // For Complete
          if (mark_as_done === "true") taskAction = "completed";
          await notificationService.addNotification(
            {
              ...payload,
              module_name: "task",
              activity_type_action: taskAction,
              activity_type: "task",
              agenda: agenda,
              title: title,
              assigned_to_name:
                capitalizeFirstLetter(user_data?.first_name) +
                " " +
                capitalizeFirstLetter(user_data?.last_name),
              due_time: new Date(due_date).toTimeString().split(" ")[0],
              due_date: new Date(due_date).toLocaleDateString("en-GB"),
              board_name: board ? board?.project_name : "",
              board_id: board ? board?._id : "",
              assign_to: user_data?._id,
              workspace_id: user?.workspace,
              status_name: getTask[0]?.status_name,
              comment_count: getTask[0]?.comments_count,
            },
            id
          );

          // -------------- Socket notification end --------------------
        });

      return {
        ...updateTasks?._doc,
        status: status_data ? status_data : "",
        comment: getTask[0]?.comments_count ?? 0,
      };
    } catch (error) {
      logger.error(`Error while Updating task, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Update Date Assignee Task
  updateDateAssigneeTask = async (payload, id, user) => {
    try {
      let { due_date, assign_to } = payload;

      if (due_date && due_date !== "null") {
        var dueDateObject = moment(due_date);
        const duetimeObject = moment(due_date);

        let updatedData = await Task.findById(id).lean();
        var timeOnly = duetimeObject.format("HH:mm:ss");

        const currentDate = moment().startOf("day");
        let check_due_date = moment(updatedData.due_date);
        if (!check_due_date.isSame(dueDateObject)) {
          if (!dueDateObject.isSameOrAfter(currentDate)) {
            return throwError(returnMessage("activity", "dateinvalid"));
          }
        }
      }

      if (payload?.assign_to) {
        payload.assign_to = JSON.parse(assign_to);
      }

      let updateTasksPayload = {
        ...(due_date && due_date !== "null" && { due_time: timeOnly }),
        ...(due_date &&
          due_date !== "null" && { due_date: dueDateObject.toDate() }),
        ...(payload?.assign_to &&
          payload?.assign_to[0] && { assign_to: payload?.assign_to }),
      };
      await Task.findByIdAndUpdate(id, updateTasksPayload, {
        new: true,
        useFindAndModify: false,
      });

      this.updateDateAssigneeTaskNotification(payload, id, user, dueDateObject);
      return;
    } catch (error) {
      logger.error(`Error while Updating task, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Update Date & Assignee Task Notifications
  updateDateAssigneeTaskNotification = async (
    payload,
    id,
    user,
    dueDateObject
  ) => {
    try {
      let { due_date, assign_to } = payload;

      const pipeline = [
        {
          $lookup: {
            from: "authentications",
            let: { assign_to_ids: "$assign_to" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$assign_to_ids"],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  first_name: 1,
                  last_name: 1,
                  profile_image: 1,
                },
              },
            ],
            as: "team_data",
          },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "assign_by",
            foreignField: "_id",
            as: "assign_by",
            pipeline: [
              {
                $project: {
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  assigned_by_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: { path: "$assign_by", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "sections",
            localField: "activity_status",
            foreignField: "_id",
            as: "statusName",
          },
        },
        {
          $unwind: { path: "$statusName", preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            is_deleted: false,
          },
        },
        {
          $project: {
            agenda: 1,
            assigned_by_first_name: "$assign_by.first_name",
            assigned_by_last_name: "$assign_by.last_name",
            assigned_to_first_name: "$team_data.first_name",
            assigned_to_last_name: "$team_data.last_name",
            assigned_to_name: "$team_data.assigned_to_name",
            assigned_by_name: "$assign_by.assigned_by_name",
            client_name: "$client_Data.client_name",
            column_id: "$status.name",
            assign_email: "$team_data.email",
            agency_id: 1,
            status_name: "$statusName.section_name",
            board_id: 1,
            comments_count: { $size: "$comments" },
            priority: 1,
            due_date: 1,
            due_time: 1,
            title: 1,
            assign_to: 1,
          },
        },
      ];
      const getTask = await Task.aggregate(pipeline);

      const board = await Board.findById(getTask[0]?.board_id).lean();
      const configuration = await Configuration.findOne({}).lean();
      const link = `${process.env.REACT_APP_URL}/${user?.workspace_detail?.name}/tasks/board/${board?._id}`;

      let ist_date;
      let ist_time;
      let assign_to_list;
      if (!due_date && payload?.assign_to) {
        const ist_date_time = moment
          .utc(getTask[0]?.due_date)
          .add(5, "hours")
          .add(30, "minutes");

        // Separate date and time
        ist_date = ist_date_time.format("YYYY-MM-DD");
        ist_time = ist_date_time.format("HH:mm");

        assign_to_list = payload?.assign_to;
      } else {
        const indianTimeZone = dueDateObject
          ?.tz("Asia/Kolkata")
          .format("HH:mm");

        ist_date = moment(dueDateObject)?.format("DD/MM/YYYY");
        ist_time = indianTimeZone;

        assign_to_list = getTask[0]?.assign_to;
      }

      assign_to_list &&
        assign_to_list[0] &&
        assign_to_list.forEach(async (user_id) => {
          var user_data = await Authentication.findById(user_id).lean();

          let data = {
            TaskTitle: "Updated Task ",
            taskName: getTask[0]?.title,
            status: getTask[0]?.status_name,
            assign_by: capitalizeFirstLetter(getTask[0]?.assigned_by_name),
            dueDate: ist_date ?? "-",
            dueTime: ist_time ?? "-",
            agginTo_email: user_data?.email,
            assignName:
              capitalizeFirstLetter(user_data?.first_name) +
              " " +
              capitalizeFirstLetter(user_data?.last_name),
            board_name: board ? board?.project_name : "",
            board_id: board ? board?._id : "",
            status_name: getTask[0]?.status_name,
            workspace_name: user?.workspace_detail?.name,
            priority: getTask[0].priority,
            REACT_APP_URL: process.env.REACT_APP_URL,
            SERVER_URL: process.env.SERVER_URL,
            link: link,
            instagram: configuration?.urls?.instagram,
            facebook: configuration?.urls?.facebook,
            privacy_policy: configuration?.urls?.privacy_policy,
            year: new Date().getFullYear(),
          };
          const taskMessage = taskTemplate(data);
          sendEmail({
            email: user_data?.email,
            subject: returnMessage("activity", "UpdateSubject"),
            message: taskMessage,
          });

          // -------------- Socket notification start --------------------

          let taskAction = "update";
          // For Complete
          await notificationService.addNotification(
            {
              ...payload,
              module_name: "task",
              activity_type_action: taskAction,
              activity_type: "task",
              agenda: getTask[0]?.agenda ?? "-",
              title: getTask[0]?.title ?? "-",
              assigned_to_name:
                capitalizeFirstLetter(user_data?.first_name) +
                " " +
                capitalizeFirstLetter(user_data?.last_name),
              due_time: ist_time ?? "-",
              due_date: ist_date ?? "-",
              board_name: board ? board?.project_name : "",
              board_id: board ? board?._id : "",
              assign_to: user_data?._id,
              workspace_id: user?.workspace,
              status_name: getTask[0]?.status_name,
              comment_count: getTask[0]?.comments_count,
            },
            id
          );

          // -------------- Socket notification end --------------------
        });
    } catch (error) {
      logger.error(`Error while Updating task, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Update Task Status
  updateTaskStatus = async (payload, id, user) => {
    try {
      const { status } = payload;

      let current_activity = await Task.findById(id)
        .populate("activity_status", "_id key")
        .populate("board_id", "is_deleted")
        .lean();

      if (!current_activity?.board_id?.is_deleted)
        this.increaseOrDecreaseGamification(payload, id, user);

      const new_status = await Section.findById(status).lean();

      if (
        current_activity?.activity_status?.key !== "completed" &&
        new_status?.key === "archived"
      ) {
        return throwError(returnMessage("activity", "CannotUpdate"));
      }

      const status_history = [
        { status: payload?.status, updated_by: user?._id },
      ];

      const get_complete_status = await Section.findOne({
        _id: status,
        key: "completed",
      }).lean();

      const update_data = {
        activity_status: status,
        ...(get_complete_status && { mark_as_done: true }),
        ...(new_status?.key === "archived" && { mark_as_archived: true }),
        ...(current_activity?.activity_status?.key === "completed" &&
          new_status?.key !== "archived" && { mark_as_done: false }),
        ...(payload?.status &&
          current_activity?.activity_status?._id.toString() !==
            payload?.status.toString() && {
            $push: { status_history: status_history },
          }),
      };
      this.taskStatusUpdateNotification(id, user, new_status?.section_name);
      this.getRoleSubRoleInWorkspace(user, id, update_data);
      return;
    } catch (error) {
      logger.error(`Error while Updating status, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Task Status Update Notification
  taskStatusUpdateNotification = async (id, user, section_name) => {
    try {
      const pipeline = [
        { $match: { _id: new mongoose.Types.ObjectId(id), is_deleted: false } },
        {
          $lookup: {
            from: "authentications",
            let: { assign_to_ids: "$assign_to" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$assign_to_ids"],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  email: 1,
                  assigned_to_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
            as: "team_data",
          },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "assign_by",
            foreignField: "_id",
            as: "assign_by",
            pipeline: [
              {
                $project: {
                  name: 1,
                  first_name: 1,
                  last_name: 1,
                  assigned_by_name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                },
              },
            ],
          },
        },
        { $unwind: { path: "$assign_by", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "sections",
            localField: "activity_status",
            foreignField: "_id",
            as: "status",
            pipeline: [{ $project: { section_name: 1 } }],
          },
        },
        { $unwind: { path: "$status", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            agenda: 1,
            assigned_by_first_name: "$assign_by.first_name",
            assigned_by_last_name: "$assign_by.last_name",
            assigned_by_name: "$assign_by.assigned_by_name",
            due_date: 1,
            due_time: 1,
            title: 1,
            assign_to: "$team_data",
            assign_by: 1,
            board_id: 1,
            priority: 1,
            comments_count: { $size: "$comments" },
          },
        },
      ];

      const getTask = await Task.aggregate(pipeline);
      const board = await Board.findById(getTask[0]?.board_id).lean();
      const configuration = await Configuration.findOne({}).lean();
      const link = `${process.env.REACT_APP_URL}/${user?.workspace_detail?.name}/tasks/board/${board?._id}`;

      getTask &&
        getTask?.[0] &&
        getTask?.[0]?.assign_to?.forEach(async (assignee) => {
          let data = {
            TaskTitle: "Task status update",
            taskName: getTask?.[0]?.title ?? "-",
            status_name: section_name ?? "-",
            assign_by: getTask[0]?.assigned_by_name ?? "-",
            dueDate: moment(getTask[0]?.due_date)?.format("DD/MM/YYYY") ?? "-",
            dueTime: getTask[0]?.due_time ?? "-",
            agginTo_email: assignee?.email ?? "-",
            assignName: assignee?.assigned_to_name ?? "-",
            board_name: board ? board?.project_name : "",
            priority: getTask[0]?.priority ?? "-",
            board_id: board ? board?._id : "",
            workspace_name: user?.workspace_detail?.name,
            REACT_APP_URL: process.env.REACT_APP_URL,
            SERVER_URL: process.env.SERVER_URL,
            link: link,
            instagram: configuration?.urls?.instagram,
            facebook: configuration?.urls?.facebook,
            privacy_policy: configuration?.urls?.privacy_policy,
            year: new Date().getFullYear(),
          };
          const taskMessage = taskTemplate(data);
          sendEmail({
            email: assignee?.email,
            subject: returnMessage("activity", "taskStatusUpdate"),
            message: taskMessage,
          });

          //   ----------    Notifications start ----------
          notificationService.addNotification(
            {
              assigned_to_name: assignee?.assigned_to_name,
              ...getTask[0],
              module_name: "task",
              assign_to: assignee?._id,
              activity_type_action: "statusUpdate",
              activity_type: "task",
              board_name: board ? board?.project_name : "",
              status_name: section_name ?? "-",
              workspace_id: user?.workspace,
              comment_count: getTask[0]?.comments_count,
              board_id: board ? board?._id : "",
            },
            id
          );
          //   ----------    Notifications end ----------
        });
    } catch (error) {
      logger.error(`Error while increasing the gamification points: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  getRoleSubRoleInWorkspace = async (user, id, update_data) => {
    try {
      const workspace = await Workspace.findById(user?.workspace).lean();
      const member_details = workspace?.members?.find(
        (member) => member?.user_id?.toString() === user?._id?.toString()
      );
      const role = await Role_Master.findById(member_details?.role)
        .select("name")
        .lean();

      if (role?.name !== "agency" && role?.name !== "team_agency") {
        return throwError(returnMessage("auth", "insufficientPermission"));
      }

      await Task.findByIdAndUpdate(id, update_data, {
        new: true,
        useFindAndModify: false,
      });
    } catch (error) {
      logger.error(
        `Error while gettign the role and subrole in the workspace: ${error}`
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Overdue crone Job
  overdueCronJob = async () => {
    try {
      const currentDate = moment().utc();

      const overdueActivities = await Task.find({
        due_date: { $lt: currentDate.toDate() },
        mark_as_done: false,
        is_deleted: false,
      })
        .populate({
          path: "board_id",
          model: "board",
          populate: {
            path: "board_status",
            model: "board_status_master",
          },
        })
        .lean();

      for (const task of overdueActivities) {
        const is_notification = await Notification.findOne({
          task_notification_type: "overdue",
          data_reference_id: new mongoose.Types.ObjectId(task?._id),
        });

        if (
          task?.board_id?.board_status?.name === "active" &&
          task?.board_id?.is_deleted === false &&
          is_notification === null
        ) {
          for (const member of task.assign_to) {
            await notificationService.addNotification(
              {
                module_name: "task",
                activity_type_action: "overdue",
                title: task.title,
                assign_to: member,
                board_id: task?.board_id?._id,
                board_name: task?.board_id?.project_name,
                task_notification_type: "overdue",
              },
              task?._id
            );
          }
        }
      }
    } catch (error) {
      logger.error(`Error while Overdue crone Job, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // DueDate crone Job
  dueDateCronJob = async () => {
    try {
      const currentDate = moment().startOf("day"); // Set the time part to midnight for the current date

      const overdueActivities = await Task.find({
        due_date: {
          $gte: currentDate.toDate(), // Activities with due date greater than or equal to the current date
          $lt: currentDate.add(1, "days").toDate(), // Activities with due date less than the next day
        },
        mark_as_done: false,
        is_deleted: false,
      })
        .populate({
          path: "board_id",
          model: "board",
          populate: {
            path: "board_status",
            model: "board_status_master",
          },
        })
        .lean();

      overdueActivities?.forEach(async (item) => {
        const is_notification = await Notification.findOne({
          task_notification_type: "dueDateAlert",
          data_reference_id: new mongoose.Types.ObjectId(item?._id),
        });

        if (
          item?.board_id?.board_status?.name === "active" &&
          item?.board_id?.is_deleted === false &&
          is_notification === null
        ) {
          for (const member of item.assign_to) {
            await notificationService.addNotification(
              {
                assign_to: member,
                module_name: "task",
                activity_type_action: "dueDateAlert",
                task_notification_type: "dueDateAlert",
                title: item?.title,
                board_id: item?.board_id?._id,
                board_name: item?.board_id?.project_name,
              },
              item?._id
            );
          }
        }
      });
    } catch (error) {
      logger.error(`Error while  due date cron job, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Add Task Comment
  addTaskComment = async (payload, user) => {
    try {
      const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
      user["role"] = user_role_data?.user_role;
      user["sub_role"] = user_role_data?.sub_role;

      const { comment, task_id } = payload;
      const task = await Task.findById(task_id);

      task.comments.push({ user_id: user?._id, comment: comment });
      task.save();
      return;
    } catch (error) {
      logger.error(`Error while Add task comment: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // List task comment
  listTaskComment = async (payload, user) => {
    try {
      const { task_id } = payload;
      const task = await Task.findById(task_id);

      let comments = [];
      if (task && task?.comments?.length > 0) {
        for (const item of task?.comments) {
          const user_data = await Authentication.findById(item?.user_id).lean();
          comments.push({
            comment: item?.comment,
            user_image: user_data?.profile_image,
            name: user_data?.first_name + " " + user_data?.last_name,
            first_name: user_data?.first_name,
            last_name: user_data?.last_name,
            user_id: user_data?._id,
          });
        }
      }
      return comments;
    } catch (error) {
      logger.error(`Error while Add task comment: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Leave Task
  leaveTask = async (payload, user) => {
    try {
      const user_role_data = await authService.getRoleSubRoleInWorkspace(user);
      user["role"] = user_role_data?.user_role;
      user["sub_role"] = user_role_data?.sub_role;

      const { task_id } = payload;
      const task = await Task.findById(task_id);
      task.assign_to = task?.assign_to.filter(
        (item) => item.toString() !== user._id.toString()
      );
      task.save();

      const assign_by_data = await Authentication.findById(
        task?.assign_by
      ).lean();

      const message_payload = {
        left_user:
          capitalizeFirstLetter(user?.first_name) +
          " " +
          capitalizeFirstLetter(user?.last_name),
        title: task?.title,
        assign_by_name:
          capitalizeFirstLetter(assign_by_data?.first_name) +
          " " +
          capitalizeFirstLetter(assign_by_data?.last_name),
      };

      const message = replaceFields(returnNotification("task", "leaveTask"), {
        ...message_payload,
      });

      const notification = await Notification.create({
        user_id: task?.assign_by,
        type: "task",
        data_reference_id: task?._id,
        message: message,
        workspace_id: user?.workspace,
      });

      const with_unread_count = async (notification_data, user_id) => {
        const un_read_count = await Notification.countDocuments({
          user_id: user_id,
          is_read: false,
        });
        return {
          notification: notification_data,
          un_read_count: un_read_count,
        };
      };

      eventEmitter(
        "NOTIFICATION",
        await with_unread_count(notification, task?.assign_by),
        task?.assign_by
      );
      return;
    } catch (error) {
      logger.error(`Error while Add task comment: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Increase Or Decrease Gamification
  increaseOrDecreaseGamification = async (payload, task_id, user) => {
    try {
      const { status } = payload;
      const task_detail = await Task.findById(task_id)
        .populate("activity_status")
        .lean();
      if (!task_detail)
        return throwError(returnMessage("task", "taskNotFound"), 404);

      const [new_status, agency_role, agency_team_role, configuration] =
        await Promise.all([
          Section.findById(status).lean(),
          Role_Master.findOne({ name: "agency" }).lean(),
          Role_Master.findOne({ name: "team_agency" }).lean(),
          Configuration.findOne({}).lean(),
        ]);

      if (
        task_detail?.activity_status?.key !== "completed" &&
        new_status?.key === "completed"
      ) {
        // this is used to increase the gamification point as the task is completed
        task_detail?.assign_to?.map(async (member) => {
          const member_details = user?.workspace_detail?.members?.find(
            (m) =>
              m?.user_id?.toString() === member?.toString() &&
              (m?.role?.toString() === agency_role?._id?.toString() ||
                m?.role?.toString() === agency_team_role?._id?.toString())
          );

          if (!member_details) return;

          await Gamification.create({
            user_id: member,
            agency_id: task_detail?.assign_by,
            point:
              configuration?.competition?.successful_task_competition?.toString(),
            type: "task",
            role: member_details?.role,
            task_id,
            workspace_id: user?.workspace,
          });

          await Workspace.findOneAndUpdate(
            { _id: user?.workspace, "members.user_id": member },
            {
              $inc: {
                "members.$.gamification_points":
                  configuration?.competition?.successful_task_competition,
              },
            }
          );

          notificationService.addNotification({
            module_name: "referral",
            action_type: "taskAdded",
            task_name: task_detail?.title,
            receiver_id: member,
            points:
              configuration?.competition?.successful_task_competition?.toString(),
          });
        });
      } else if (
        task_detail?.activity_status?.key === "completed" &&
        new_status?.key !== "completed" &&
        new_status?.key !== "archived"
      ) {
        // this is used to decrease the point as the task is moved from the completed to the other stage
        // this is used to get the users point if they have get any points on the successfull completed task
        const gamification_history = await Gamification.find({
          user_id: { $in: task_detail?.assign_to },
          workspace_id: user?.workspace,
          task_id,
          type: "task",
        })
          .populate("role", "name")
          .lean();

        task_detail?.assign_to?.map(async (member) => {
          const member_details = gamification_history.find(
            (m) =>
              m?.user_id?.toString() === member?.toString() &&
              !m?.point?.startsWith("-") &&
              (m?.role?.name === "agency" || m?.role?.name === "team_agency")
          );

          if (!member_details) return;

          await Gamification.create({
            user_id: member,
            agency_id: task_detail?.assign_by,
            point:
              -configuration?.competition?.successful_task_competition?.toString(),
            type: "task",
            role: member_details?.role?._id,
            task_id,
            workspace_id: user?.workspace,
          });

          await Workspace.findOneAndUpdate(
            { _id: user?.workspace, "members.user_id": member },
            {
              $inc: {
                "members.$.gamification_points":
                  -configuration?.competition?.successful_task_competition,
              },
            },
            { new: true }
          );

          notificationService.addNotification({
            module_name: "referral",
            action_type: "taskDeduct",
            task_name: task_detail?.title,
            receiver_id: member,
            points:
              -configuration?.competition?.successful_task_competition?.toString(),
          });
        });
      }
    } catch (error) {
      logger.error(`Error while increasing the gamification points: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = TaskService;
