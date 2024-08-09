const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const Activity = require("../models/activitySchema");
const moment = require("moment");
const mongoose = require("mongoose");
const Task = require("../models/taskSchema");
const { capitalizeFirstLetter } = require("../utils/utils");
const Section = require("../models/sectionSchema");
const Workspace = require("../models/workspaceSchema");
const Agreement = require("../models/agreementSchema");
const Invoice = require("../models/invoiceSchema");
const ActivityService = require("./activityService");
const activityService = new ActivityService();

// Register Agency
class dashboardService {
  // Dashboard data

  dashboardData = async (user) => {
    try {
      const currentDate = moment().utc();
      const startOfToday = moment(currentDate).startOf("day").utc();
      const endOfToday = moment(currentDate).endOf("day").utc();

      const workspaceId = new mongoose.Types.ObjectId(user?.workspace);
      const userId = new mongoose.Types.ObjectId(user?._id);

      let is_admin;
      if (user?.role === "agency") is_admin = true;
      else if (user?.role === "team_agency" && user?.sub_role === "team_member")
        is_admin = false;
      else if (user?.role === "team_agency" && user?.sub_role === "admin")
        is_admin = true;
      else if (user?.role === "client") is_admin = false;
      else if (user?.role === "team_client") is_admin = false;

      const assign_to_data = !is_admin ? { assign_to: userId } : {};
      const todays_call_meeting = !is_admin ? { attendees: userId } : {};
      const invoice_client =
        user?.role === "client" ? { client_id: userId } : {};
      const agreement_receiver =
        user?.role === "client" ? { receiver: userId } : {};

      // Task Counts
      const taskPromises = await Task.aggregate([
        {
          $match: {
            workspace_id: workspaceId,
            is_deleted: false,
            ...assign_to_data,
          },
        },
        {
          $lookup: {
            from: "sections",
            localField: "activity_status",
            foreignField: "_id",
            as: "tasks",
          },
        },
        {
          $unwind: { path: "$tasks", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "boards",
            localField: "board_id",
            foreignField: "_id",
            as: "board_data",
            pipeline: [{ $project: { board_status: 1 } }],
          },
        },
        {
          $unwind: { path: "$board_data", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "board_status_masters",
            localField: "board_data.board_status",
            foreignField: "_id",
            as: "board_status",
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        {
          $unwind: { path: "$board_status", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            data: "$tasks",
            due_date: 1,
            mark_as_done: 1,
            board_status: "$board_status",
          },
        },
      ]);
      const totalTaskCount = taskPromises.filter(
        (task) => task?.board_status?.name === "active"
      ).length;

      const overdueTaskCount = taskPromises.filter(
        (task) =>
          task?.due_date < currentDate.toDate() &&
          !task?.mark_as_done &&
          task?.board_status?.name === "active"
      ).length;
      const completedTaskCount = taskPromises.filter(
        (task) => task?.mark_as_done && task?.board_status?.name === "active"
      ).length;

      // Invoice Counts

      if (
        user?.role === "agency" ||
        user?.role === "client" ||
        user?.sub_role === "admin"
      ) {
        const InvoiceData = await Invoice.aggregate([
          {
            $match: {
              workspace_id: workspaceId,
              is_deleted: false,
              ...invoice_client,
            },
          },
          {
            $lookup: {
              from: "invoice_status_masters",
              localField: "status",
              foreignField: "_id",
              as: "invoiceStatus",
              pipeline: [{ $project: { name: 1 } }],
            },
          },
          {
            $unwind: {
              path: "$invoiceStatus",
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              data: "$invoiceStatus",
            },
          },
        ]);

        var overdueInvoiceCount = InvoiceData.filter(
          (invoice) => invoice?.data?.name === "overdue"
        ).length;
        var invoiceSentCount = InvoiceData.filter(
          (invoice) => invoice?.data?.name === "unpaid"
        ).length;
      }
      if (
        user?.role === "agency" ||
        user?.role === "client" ||
        user?.sub_role === "admin"
      ) {
        // Members Count
        const membersData = await Workspace.aggregate([
          { $match: { _id: workspaceId } },
          { $unwind: { path: "$members", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "authentications",
              localField: "members.user_id",
              foreignField: "_id",
              as: "user_details",
            },
          },
          {
            $unwind: {
              path: "$user_details",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "role_masters",
              localField: "members.role",
              foreignField: "_id",
              as: "status",
            },
          },
          { $unwind: { path: "$status", preserveNullAndEmptyArrays: true } },
          {
            $match: {
              "members.status": "confirmed",
              "user_details.is_deleted": false,
            },
          },
          {
            $project: {
              status: "$status",
              client_id: "$members.client_id",
            },
          },
        ]);

        if (user?.role === "agency" || user?.sub_role === "admin") {
          var clientCount = membersData.filter(
            (member) => member?.status?.name === "client"
          ).length;

          var teamMemberCount = membersData.filter(
            (member) => member?.status?.name === "team_agency"
          ).length;
        }
        if (user?.role === "client") {
          var teamMemberCount = membersData.filter(
            (member) =>
              member?.status?.name === "team_client" &&
              member?.client_id?.toString() === user?._id?.toString()
          ).length;
        }
      }

      // Call meeting aggregations
      const todaysCallMeeting = await Activity.aggregate([
        {
          $match: {
            is_deleted: false,
            workspace_id: workspaceId,
            meeting_date: {
              $gte: startOfToday.toDate(),
              $lte: endOfToday.toDate(),
            },
            ...todays_call_meeting,
          },
        },
        {
          $count: "todaysCallMeeting",
        },
      ]);

      // Agreement aggregations
      if (
        user?.role === "agency" ||
        user?.role === "client" ||
        user?.sub_role === "admin"
      ) {
        var agreementPendingCount = await Agreement.aggregate([
          {
            $match: {
              workspace_id: workspaceId,
              status: "sent",
              is_deleted: false,
              ...agreement_receiver,
            },
          },
          {
            $count: "agreementPendingCount",
          },
        ]);
      }

      const commonFields = {
        task_count: totalTaskCount ?? 0,
        overdue_task_count: overdueTaskCount ?? 0,
        completed_task_count: completedTaskCount ?? 0,
        todays_call_meeting: todaysCallMeeting[0]?.todaysCallMeeting ?? 0,
      };

      if (user?.role === "agency") {
        return {
          ...commonFields,
          client_count: clientCount ?? 0,
          team_member_count: teamMemberCount ?? 0,
          invoice_overdue_count: overdueInvoiceCount ?? 0,
          invoice_sent_count: invoiceSentCount ?? 0,
          agreement_pending_count:
            agreementPendingCount[0]?.agreementPendingCount ?? 0,
        };
      } else if (user?.role === "client") {
        return {
          ...commonFields,
          team_member_count: teamMemberCount ?? 0,
          invoice_overdue_count: overdueInvoiceCount ?? 0,
          invoice_sent_count: invoiceSentCount ?? 0,
          agreement_pending_count:
            agreementPendingCount[0]?.agreementPendingCount ?? 0,
        };
      } else if (user?.role === "team_client") {
        return commonFields;
      } else if (
        user?.role === "team_agency" &&
        user?.sub_role === "team_member"
      ) {
        return commonFields;
      } else if (user?.role === "team_agency" && user?.sub_role === "admin") {
        return {
          ...commonFields,
          client_count: clientCount ?? 0,
          team_member_count: teamMemberCount ?? 0,
          invoice_overdue_count: overdueInvoiceCount ?? 0,
          invoice_sent_count: invoiceSentCount ?? 0,
          agreement_pending_count:
            agreementPendingCount[0]?.agreementPendingCount ?? 0,
        };
      }
    } catch (error) {
      logger.error(`Error while fetching dashboard data for agency: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Completed task
  taskTask = async (payload, user) => {
    try {
      // let is_admin = false;
      // if (user?.role === "agency") is_admin = false;
      // if (user?.role === "client") is_admin = false;
      // if (user?.role === "team_client") is_admin = false;
      // if (user?.role === "team_agency") {
      //   if (user?.sub_role === "team_member") {
      //     is_admin = false;
      //   }
      //   if (user?.sub_role === "admin") {
      //     is_admin = true;
      //   }
      // }

      const workspaceId = new mongoose.Types.ObjectId(user?.workspace);
      const userId = new mongoose.Types.ObjectId(user?._id);

      // const filter_data = {
      //   workspace_id: workspaceId,
      //   ...(payload.list_type === "completed" && { key: payload.list_type }),
      // };

      let filter_data = { workspace_id: workspaceId };

      if (payload.list_type === "completed") {
        filter_data.key = payload.list_type;
      } else if (payload.list_type === "all") {
        filter_data.key = { $nin: ["completed", "archived"] };
      }
      const completed_task_ids = await Section.distinct("_id", filter_data);

      const [completedTasks] = await Promise.all([
        Task.aggregate([
          {
            $match: {
              workspace_id: workspaceId,
              is_deleted: false,
              assign_to: userId,
              activity_status: { $in: completed_task_ids },
            },
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
            $unwind: {
              path: "$statusName",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "boards",
              localField: "board_id",
              foreignField: "_id",
              as: "board_data",
              pipeline: [{ $project: { board_status: 1 } }],
            },
          },
          {
            $unwind: { path: "$board_data", preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: "board_status_masters",
              localField: "board_data.board_status",
              foreignField: "_id",
              as: "board_status",
              pipeline: [{ $project: { name: 1 } }],
            },
          },
          {
            $unwind: {
              path: "$board_status",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "board_status.name": "active",
            },
          },
          {
            $project: {
              _id: 1,
              title: 1,
              due_date: 1,
              due_time: 1,
              assign_by: 1,
              activity_status: 1,
              priority: 1,
              createdAt: 1,
              status: "$statusName",
              board_status: "$board_status",
            },
          },
          {
            $limit: 5,
          },
          {
            $sort: { createdAt: -1 },
          },
        ]),
      ]);
      return completedTasks;
    } catch (error) {
      logger.error(`Error while fetch todays task: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  callMeetingList = async (payload, user) => {
    try {
      let is_admin;
      if (user?.role === "agency") is_admin = true;
      if (user?.role === "client") is_admin = false;
      if (user?.role === "team_client") is_admin = false;
      if (user?.role === "team_agency") {
        if (user?.sub_role === "team_member") {
          is_admin = false;
        }
        if (user?.sub_role === "admin") {
          is_admin = false;
        }
      }

      const workspaceId = new mongoose.Types.ObjectId(user?.workspace);
      const userId = new mongoose.Types.ObjectId(user?._id);
      const start_of_day = moment
        .utc(payload?.date, "DD-MM-YYYY")
        .startOf("day");
      const end_of_day = moment.utc(payload?.date, "DD-MM-YYYY").endOf("day");

      const pipeline = [
        {
          $match: {
            workspace_id: workspaceId,
            is_deleted: false,
            ...(!is_admin && { attendees: userId }),
            meeting_date: { $lte: end_of_day.toDate() },
            $expr: {
              $or: [
                { $not: { $gte: ["$recurrence_end_date", start_of_day] } }, // Condition to match documents without the recurrence_end_date field
                { $gte: ["$recurrence_end_date", start_of_day] }, // Condition to match documents with the recurrence_end_date field and check its value
              ],
            },
          },
        },
        {
          $lookup: {
            from: "activity_status_masters",
            localField: "activity_status",
            foreignField: "_id",
            as: "activity_status",
          },
        },
        {
          $unwind: {
            path: "$activity_status",
            preserveNullAndEmptyArrays: true,
          },
        },
      ];
      const activity = await Activity.aggregate(pipeline);

      let activity_array = [];
      const filter_start = moment.utc(start_of_day);
      activity &&
        activity[0] &&
        activity.forEach(async (act) => {
          if (
            payload?.date &&
            act?.recurrence_end_date &&
            act?.recurrence_pattern &&
            act?.recurrence_end_date !== null &&
            act?.recurrence_pattern !== null
          ) {
            act.filter_end_date = end_of_day;
            act.filter_start_date = start_of_day;
            const others_meetings = activityService.generateMeetingTimes(act);
            activity_array = [...activity_array, ...others_meetings];
          } else {
            let meeting_date = moment.utc(act?.meeting_date);
            if (meeting_date?.isSame(filter_start)) {
              let obj = {
                id: act?._id,
                title: act?.title,
                description: act?.agenda,
                all_day: act?.all_day,
                start: act?.meeting_start_time,
                end: act?.meeting_end_time,
                status: act?.activity_status?.name,
              };
              activity_array.push(obj);
            }
          }
        });
      activity_array = [...activity_array];

      return activity_array;

      // return activity;
    } catch (error) {
      logger.error(`Error while fetch todays task: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = dashboardService;
