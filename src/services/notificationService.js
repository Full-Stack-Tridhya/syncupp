const Notification = require("../models/notificationSchema");
const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const {
  returnNotification,
  replaceFields,
  extractTextFromHtml,
} = require("../utils/utils");

const { eventEmitter } = require("../socket");
const Admin = require("../models/adminSchema");

class NotificationService {
  // Add Notification

  addNotification = async (payload, id) => {
    let {
      module_name,
      activity_type_action,
      client_id,
      agenda,
      workspace_id,
      event_name,
    } = payload;
    if (payload?.agenda) payload.agenda = extractTextFromHtml(agenda);
    try {
      var with_unread_count = async (notification_data, user_id) => {
        const un_read_count = await Notification.countDocuments({
          user_id: user_id,
          is_read: false,
          workspace_id: workspace_id,
        });
        return {
          notification: notification_data,
          un_read_count: un_read_count,
          workspace_id,
        };
      };

      // Activity
      if (module_name === "activity") {
        const { attendees } = payload;
        let message_type;
        if (activity_type_action === "create_call_meeting")
          message_type = "createCallMeeting";
        else if (activity_type_action === "update")
          message_type = "activityUpdated";
        else if (activity_type_action === "cancel")
          message_type = "activityCancelled";
        else if (activity_type_action === "completed")
          message_type = "activityCompleted";
        else if (activity_type_action === "pending")
          message_type = "activityPending";
        else if (activity_type_action === "dueDateAlert")
          message_type = "activityDueDate";
        else if (activity_type_action === "meetingAlert")
          message_type = "meetingAlert";

        const createAndEmitNotification = async (
          userId,
          messageType,
          receiver
        ) => {
          const message = replaceFields(
            returnNotification("activity", messageType, receiver),
            { ...payload }
          );

          const notification = await Notification.create({
            user_id: userId,
            type: "activity",
            data_reference_id: id,
            message: message,
            workspace_id: payload?.workspace_id,
          });

          eventEmitter(
            "NOTIFICATION",
            await with_unread_count(notification, userId),
            userId,
            payload?.workspace_id
          );
        };

        if (activity_type_action === "meetingAlert") {
          // await createAndEmitNotification(
          //   payload.assign_by,
          //   message_type,
          //   "alertMessage"
          // );
          // if (String(payload.payload?.assign_to) !== String(payload.assign_by)) {
          //   await createAndEmitNotification(
          //     payload.payload?.assign_to,
          //     message_type,
          //     "alertMessage"
          //   );
          // }

          attendees &&
            attendees[0] &&
            attendees.map(async (item) => {
              await createAndEmitNotification(
                item,
                message_type,
                "alertMessage"
              );
            });
        } else {
          attendees &&
            attendees[0] &&
            attendees.map(async (item) => {
              await createAndEmitNotification(
                item,
                message_type,
                "attendeesMessage"
              );
            });
        }
      }

      // Task

      if (module_name === "task") {
        let type = "task";
        let message_type;
        if (activity_type_action === "createTask") message_type = "createTask";
        else if (activity_type_action === "completed")
          message_type = "taskCompleted";
        else if (activity_type_action === "update")
          message_type = "taskUpdated";
        else if (activity_type_action === "statusUpdate")
          message_type = "taskStatusUpdate";
        else if (activity_type_action === "deleted") {
          message_type = "taskDeleted";
          type = "deleted";
        } else if (activity_type_action === "dueDateAlert")
          message_type = "taskDueDate";
        else if (activity_type_action === "overdue")
          message_type = "taskOverdue";
        const createAndEmitNotification = async (
          userId,
          messageType,
          receiver
        ) => {
          const message = replaceFields(
            returnNotification("task", messageType, receiver),
            { ...payload }
          );

          const notification = await Notification.create({
            user_id: userId,
            type: type,
            data_reference_id: id,
            message: message,
            workspace_id,
            task_notification_type: payload?.task_notification_type,
          });

          eventEmitter(
            "NOTIFICATION",
            await with_unread_count(notification, userId),
            userId,
            workspace_id
          );
        };

        await createAndEmitNotification(
          payload?.assign_to,
          message_type,
          "assignToMessage"
        );
      }

      // Agreement

      if (module_name === "agreement") {
        const { action_type, receiver_id, sender_id } = payload;
        let message_type;
        if (action_type === "create") message_type = "create";
        else if (action_type === "statusUpdate") message_type = "statusUpdate";

        const createAndEmitNotification = async (userId, messageType) => {
          const message = replaceFields(
            returnNotification("agreement", messageType),
            { ...payload }
          );
          const notification = await Notification.create({
            user_id: userId,
            type: "agreement",
            data_reference_id: id,
            message: message,
            workspace_id: payload?.workspace_id,
          });

          eventEmitter(
            "NOTIFICATION",
            await with_unread_count(notification, userId),
            userId,
            workspace_id
          );
        };
        if (action_type === "create")
          await createAndEmitNotification(receiver_id, message_type);
        if (action_type === "statusUpdate")
          await createAndEmitNotification(sender_id, message_type);
      }

      // Invoice

      if (module_name === "invoice") {
        const { action_type, receiver_id, sender_id } = payload;
        let message_type;
        if (action_type === "create") message_type = "create";
        else if (action_type === "updateStatusUnpaid") message_type = "create";
        else if (action_type === "overdue") message_type = "invoiceDue";
        else if (action_type === "updateStatusPaid")
          message_type = "invoicePaid";
        else if (action_type === "agencyOverdue")
          message_type = "invoiceOverdueAgency";

        const createAndEmitNotification = async (userId, messageType) => {
          const message = replaceFields(
            returnNotification("invoice", messageType),
            { ...payload }
          );
          const notification = await Notification.create({
            user_id: userId,
            type: "invoice",
            data_reference_id: id,
            message: message,
            workspace_id,
          });

          eventEmitter(
            "NOTIFICATION",
            await with_unread_count(notification, userId),
            userId,
            workspace_id
          );
        };
        await createAndEmitNotification(receiver_id, message_type);
      }

      // Common function for single notification
      const createAndEmitNotification = async (
        userId,
        messageType,
        messageKey,
        dataType,
        event_name = "NOTIFICATION"
      ) => {
        const message = replaceFields(
          returnNotification(messageKey, messageType),
          { ...payload }
        );
        const notification = await Notification.create({
          user_id: userId,
          type: dataType,
          data_reference_id: id,
          message: message,
          workspace_id,
        });
        eventEmitter(
          event_name,
          await with_unread_count(notification, userId),
          userId,
          workspace_id
        );
      };

      if (module_name === "general") {
        const { action_name } = payload;

        // User Joined to the Workspace
        if (action_name === "memberJoined") {
          await createAndEmitNotification(
            payload.receiver_id,
            "memberJoined",
            "general",
            "general"
          );
        }
        // this is only used when client member joined to the workspace
        if (action_name === "clientMemberJoined") {
          await createAndEmitNotification(
            payload.receiver_id,
            "memberJoined",
            "general",
            "general"
          );
        }
        //  Add team member by client
        if (action_name === "agencyAdded") {
          await createAndEmitNotification(
            payload.receiver_id,
            "clientTeamMemberAdded",
            "general",
            "general"
          );
        }

        // client Team member password set
        if (action_name === "teamClientPasswordSet") {
          await createAndEmitNotification(
            payload.receiver_id,
            "clientTeamJoined",
            "general",
            "general"
          );
          await createAndEmitNotification(
            payload.client_id,
            "clientTeamJoined",
            "general",
            "general"
          );
        }

        // client  password set

        if (action_name === "clientPasswordSet") {
          await createAndEmitNotification(
            payload.receiver_id,
            "clientJoined",
            "general",
            "general"
          );
        }

        //  client Member payment done

        if (action_name === "memberPaymentDone") {
          await createAndEmitNotification(
            payload.receiver_id,
            "clientTeamPaymentDone",
            "general",
            "general"
          );
        }

        // client  Member payment Fail

        if (action_name === "memberPaymentFail") {
          await createAndEmitNotification(
            payload.receiver_id,
            "clientTeamPaymentFail",
            "general",
            "general"
          );
        }

        // cMember deleted by client

        if (action_name === "memberDeleted") {
          await createAndEmitNotification(
            payload.receiver_id,
            "memberDeletedClient",
            "general",
            "deleted"
          );
        }

        // cMember deleted by agency

        if (action_name === "memberDeletedAgency") {
          await createAndEmitNotification(
            payload.receiver_id,
            "memberDeletedAgency",
            "general",
            "deleted"
          );
        }
      }

      // referral Points

      if (module_name === "referral") {
        if (payload.action_type === "login") {
          await createAndEmitNotification(
            payload.receiver_id,
            "login",
            "referral",
            "referral"
          );
        }
        if (payload.action_type === "signUp") {
          await createAndEmitNotification(
            payload.receiver_id,
            "signUp",
            "referral",
            "referral"
          );
        }
        let message_type;
        if (payload.action_type === "taskDeduct") message_type = "taskDeduct";
        if (payload.action_type === "taskAdded") message_type = "taskAdded";
        if (
          payload.action_type === "taskDeduct" ||
          payload.action_type === "taskAdded"
        ) {
          await createAndEmitNotification(
            payload.receiver_id,
            message_type,
            "referral",
            "referral"
          );
        }
      }

      // Payment

      if (payload?.module_name === "payment") {
        if (
          payload?.action_name === "team_agency" ||
          payload?.action_name === "team_client"
        ) {
          await createAndEmitNotification(
            payload?.receiver_id,
            "memberPayment",
            "payment",
            "deleted"
          );
        } else if (payload?.action_name === "client") {
          await createAndEmitNotification(
            payload?.receiver_id,
            "clientPayment",
            "payment",
            "deleted"
          );
        } else if (payload?.action_name === "agency") {
          await createAndEmitNotification(
            payload.receiver_id,
            "agencyPayment",
            "payment",
            "deleted"
          );
        }

        if (payload.action_name === "packageExpiredAlert") {
          await createAndEmitNotification(
            payload.receiver_id,
            "agencyPackageExpired",
            "payment",
            "deleted"
          );
        }
      }

      if (payload?.module_name === "board") {
        if (payload.action_name === "created") {
          payload?.members &&
            payload?.members[0] &&
            payload?.members?.map(async (item) => {
              await createAndEmitNotification(
                item,
                "boardCreated",
                "board",
                "board"
              );
            });
        }
        if (payload.action_name === "updated") {
          payload?.members &&
            payload?.members[0] &&
            payload?.members?.map(async (item) => {
              await createAndEmitNotification(
                item?.member_id,
                "boardUpdated",
                "board",
                "board"
              );
            });
        }
        if (payload.action_name === "memberRemoved") {
          payload?.members &&
            payload?.members[0] &&
            payload?.members?.map(async (item) => {
              await createAndEmitNotification(
                item,
                "memberRemoved",
                "board",
                "deleted"
              );
            });
        }
        if (payload.action_name === "memberRemovedInUpdate") {
          payload?.members &&
            payload?.members[0] &&
            payload?.members?.map(async (item) => {
              await createAndEmitNotification(
                item?.member_id,
                "memberRemoved",
                "board",
                "deleted"
              );
            });
        }
        if (payload.action_name === "boardDelete") {
          payload?.members &&
            payload?.members[0] &&
            payload?.members?.map(async (item) => {
              await createAndEmitNotification(
                item?.member_id,
                "boardDeleted",
                "board",
                "deleted"
              );
            });
        }
        if (payload.action_name === "boardArchived") {
          payload?.members &&
            payload?.members[0] &&
            payload?.members?.map(async (item) => {
              await createAndEmitNotification(
                item?.member_id,
                "boardArchived",
                "board",
                "board"
              );
            });
        }
        if (payload.action_name === "boardUnArchived") {
          payload?.members &&
            payload?.members[0] &&
            payload?.members?.map(async (item) => {
              await createAndEmitNotification(
                item?.member_id,
                "boardUnArchived",
                "board",
                "board"
              );
            });
        }
      }

      return;
    } catch (error) {
      logger.error(`Error while fetching agencies: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Admin Notification
  addAdminNotification = async (payload, id) => {
    try {
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

      const admin = await Admin.findOne({}).lean();
      let { action_name } = payload;
      const createAndEmitNotification = async (
        userId,
        messageType,
        messageKey,
        dataType
      ) => {
        const message = replaceFields(
          returnNotification(messageKey, messageType),
          { ...payload }
        );
        const notification = await Notification.create({
          user_id: userId,
          type: dataType,
          data_reference_id: id,
          message: message,
        });

        eventEmitter(
          "NOTIFICATION",
          await with_unread_count(notification, userId),
          userId
        );
      };

      //  Add team member by client
      if (action_name === "agencyCreated") {
        await createAndEmitNotification(
          admin._id,
          "agencyCreated",
          "admin",
          "agency"
        );
      }

      //  seat remover
      else if (action_name === "seatRemoved") {
        if (payload.user_type === "client") {
          await createAndEmitNotification(
            admin._id,
            "clientSeatRemoved",
            "admin",
            "deleted"
          );
        } else if (payload.user_type === "Team Agency") {
          await createAndEmitNotification(
            admin._id,
            "teamAgencySeatRemoved",
            "admin",
            "deleted"
          );
        } else if (payload.user_type === "Team Client") {
          await createAndEmitNotification(
            admin._id,
            "teamClientSeatRemoved",
            "admin",
            "deleted"
          );
        }
      }

      // Payment
      else if (payload.module_name === "payment") {
        if (
          payload.action_name === "team_agency" ||
          payload.action_name === "team_client"
        ) {
          await createAndEmitNotification(
            admin._id,
            "memberPayment",
            "admin",
            "deleted"
          );
        } else if (payload.action_name === "client") {
          await createAndEmitNotification(
            admin._id,
            "clientPayment",
            "admin",
            "deleted"
          );
        } else if (payload.action_name === "agency") {
          await createAndEmitNotification(
            admin._id,
            "agencyPayment",
            "admin",
            "deleted"
          );
        }
      }

      // inquiry
      else if (payload.module_name === "inquiry") {
        await createAndEmitNotification(
          admin._id,
          "newInquiry",
          "admin",
          "deleted"
        );
      }

      // inquiry
      else if (payload.module_name === "ticket") {
        await createAndEmitNotification(
          admin._id,
          "newTicket",
          "admin",
          "deleted"
        );
      }

      return;
    } catch (error) {
      logger.error(`Error while fetching agencies: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Get Notifications
  getNotification = async (user, searchObj) => {
    try {
      const { skip, limit, type, sort_order } = searchObj;
      const filter_obj = {};

      if (type && type !== "") {
        filter_obj["type"] = type;
      }

      const [notifications, un_read_count, total_notification] =
        await Promise.all([
          Notification.aggregate([
            {
              $match: {
                type: { $nin: ["chat", "group"] },
                user_id: user?._id,
                workspace_id: user?.workspace_detail?._id,
              },
            },
            { $match: filter_obj },
            {
              $sort: { createdAt: sort_order === "asc" ? 1 : -1, is_read: -1 },
            },
            { $skip: parseInt(skip) },
            { $limit: parseInt(limit) },
            {
              $facet: {
                // Stage for notifications with type other than "task"
                notifications: [
                  {
                    $match: { type: { $ne: "task" } },
                  },
                  // Additional stages as needed
                ],
                // Stage for notifications with type "task"
                taskNotifications: [
                  {
                    $match: { type: "task" },
                  },
                  {
                    $lookup: {
                      from: "tasks",
                      localField: "data_reference_id",
                      foreignField: "_id",
                      as: "task_data",
                      pipeline: [
                        {
                          $project: {
                            board_id: 1,
                            _id: 1,
                            assign_by: 1,
                            title: 1,
                            activity_status: 1,
                            comments: 1,
                          },
                        },
                      ],
                    },
                  },
                  {
                    $unwind: {
                      path: "$task_data",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $lookup: {
                      from: "boards",
                      localField: "task_data.board_id",
                      foreignField: "_id",
                      as: "board_data",
                      pipeline: [
                        {
                          $project: { board_image: 1, project_name: 1, _id: 1 },
                        },
                      ],
                    },
                  },
                  {
                    $unwind: {
                      path: "$board_data",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $lookup: {
                      from: "authentications",
                      localField: "task_data.assign_by",
                      foreignField: "_id",
                      as: "assigned_by_data",
                      pipeline: [
                        {
                          $project: {
                            email: 1,
                            first_name: 1,
                            last_name: 1,
                            full_name: {
                              $concat: ["$first_name", " ", "$last_name"],
                            },
                            _id: 1,
                          },
                        },
                      ],
                    },
                  },
                  {
                    $unwind: {
                      path: "$assigned_by_data",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $lookup: {
                      from: "authentications",
                      localField: "user_id",
                      foreignField: "_id",
                      as: "assign_to_data",
                      pipeline: [
                        {
                          $project: {
                            email: 1,
                            _id: 1,
                          },
                        },
                      ],
                    },
                  },
                  {
                    $unwind: {
                      path: "$assign_to_data",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $lookup: {
                      from: "sections",
                      localField: "task_data.activity_status",
                      foreignField: "_id",
                      as: "section_data",
                      pipeline: [
                        {
                          $project: {
                            section_name: 1,
                            _id: 1,
                          },
                        },
                      ],
                    },
                  },
                  {
                    $unwind: {
                      path: "$section_data",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                ],
              },
            },

            {
              $project: {
                notifications: {
                  $concatArrays: [
                    "$notifications", // Existing notifications array
                    {
                      $map: {
                        input: "$taskNotifications",
                        as: "taskNotif",
                        in: {
                          $mergeObjects: [
                            "$$taskNotif",
                            {
                              comment_count: {
                                $size: "$$taskNotif.task_data.comments",
                              },
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
            {
              $unwind: "$notifications", // Unwind to flatten the combined array
            },
            {
              $replaceRoot: { newRoot: "$notifications" }, // Replace root with flattened documents
            },
            {
              $sort: { createdAt: sort_order === "asc" ? 1 : -1, is_read: -1 },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                notifications: { $push: "$$ROOT" },
              },
            },
            {
              $sort: { _id: -1 }, // Sort the grouped results by day in decending order
            },
            {
              $project: {
                _id: 0,
                date: "$_id",
                notifications: 1,
              },
            },
            {
              $group: {
                _id: null,
                data: {
                  $push: {
                    k: "$date",
                    v: "$notifications",
                  },
                },
              },
            },
            {
              $replaceRoot: {
                newRoot: {
                  $arrayToObject: "$data",
                },
              },
            },
          ]),
          Notification.find({
            type: { $nin: ["chat", "group"] },
            user_id: user?._id,
            workspace_id: user?.workspace,
            is_read: false,
          }).countDocuments(),
          Notification.aggregate([
            {
              $match: {
                type: { $nin: ["chat", "group"] },
                user_id: user?._id,
                workspace_id: user?.workspace_detail?._id,
              },
            },
            { $match: filter_obj },
          ]),
        ]);
      return {
        notificationList: notifications,
        un_read_count: un_read_count,
        page_count: Math.ceil(total_notification.length / limit) || 0,
      };
    } catch (error) {
      logger.error(`Error while fetching agencies: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // Read Notifications
  readNotification = async (payload, user) => {
    try {
      const { notification_id } = payload;

      if (notification_id === "referral") {
        await Notification.updateMany(
          {
            user_id: user?._id,
            workspace_id: user?.workspace,
            type: "referral",
          },
          { $set: { is_read: true } }
        );
      } else if (notification_id === "all") {
        await Notification.updateMany(
          {
            user_id: user?._id,
            workspace_id: user?.workspace,
          },
          { $set: { is_read: true } }
        );
      } else {
        await Notification.findByIdAndUpdate(
          notification_id,
          { $set: { is_read: true } },
          { new: true }
        );
      }

      return;
    } catch (error) {
      logger.error(`Error while reading notification: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  dashBoardNotification = async (user) => {
    try {
      const [referral_notification, chat_notification] = await Promise.all([
        Notification.countDocuments({
          workspace_id: user?.workspace,
          is_read: false,
          user_id: user?._id,
          type: "referral",
          is_deleted: false,
        }),
        Notification.countDocuments({
          $or: [{ type: "chat" }, { type: "group" }],
          user_id: user?._id,
          is_read: false,
          workspace_id: user?.workspace,
        }),
      ]);

      return {
        referral_notification,
        chat_notification,
      };
    } catch (error) {
      logger.error(`Error while gettig dashboard notification: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = NotificationService;
