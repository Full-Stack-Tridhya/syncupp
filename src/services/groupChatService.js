const { throwError } = require("../helpers/errorUtil");
const logger = require("../logger");

const {
  returnMessage,
  returnNotification,
  capitalizeFirstLetter,
} = require("../utils/utils");
const Group_Chat = require("../models/groupChatSchema.js");
const { emitEvent, eventEmitter } = require("../socket.js");
const Notification = require("../models/notificationSchema.js");
const Chat = require("../models/chatSchema.js");
const statusCode = require("../messages/statusCodes.json");
const { default: mongoose } = require("mongoose");
const Workspace = require("../models/workspaceSchema.js");
const fs = require("fs");

class GroupChatService {
  usersList = async (payload, user) => {
    try {
      const search_obj = {};
      if (payload?.search && payload?.search !== "") {
        search_obj["$or"] = [
          { "user.first_name": { $regex: payload.search, $options: "i" } },
          { "user.last_name": { $regex: payload.search, $options: "i" } },
          { "user.email": { $regex: payload.search, $options: "i" } },
        ];
      }
      return await Workspace.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(user?.workspace) } },
        { $unwind: "$members" }, // Unwind the members array
        {
          $match: {
            "members.user_id": { $ne: user?._id },
            "members.status": "confirmed",
          },
        },
        {
          $lookup: {
            from: "authentications", // The collection name of the users
            localField: "members.user_id",
            foreignField: "_id",
            as: "user",
            pipeline: [
              {
                $project: {
                  first_name: 1,
                  last_name: 1,
                  name: {
                    $concat: ["$first_name", " ", "$last_name"],
                  },
                  email: 1,
                  profile_image: 1,
                  _id: 1,
                },
              },
            ],
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } }, // Unwind the user details array
        {
          $lookup: {
            from: "role_masters", // The collection name of the sub_roles
            localField: "members.role",
            foreignField: "_id",
            as: "role",
          },
        },
        {
          $unwind: { path: "$role", preserveNullAndEmptyArrays: true },
        }, // Unwind the role details array
        {
          $project: {
            user_id: "$user._id",
            first_name: "$user.first_name",
            last_name: "$user.last_name",
            name: "$user.name",
            email: "$user.email",
            profile_image: "$user.profile_image",
            role: "$role.name",
          },
        },
        { $match: search_obj },
      ]);
    } catch (error) {
      logger.error(
        `Error While fetching the users list for the Group: ${error?.message}`
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  //   this is used for the create the group
  createGroupChat = async (payload, file, user) => {
    try {
      // if (user?.role?.name !== "agency" && user?.role?.name !== "client")
      //   return throwError(returnMessage("chat", "insufficientPermission"));

      let { group_name, members } = payload;
      if (members.length === 0 || !members)
        return throwError(returnMessage("chat", "membersRequired"));

      if (!group_name || group_name === "")
        return throwError(returnMessage("chat", "groupNameRequired"));

      if (!Array.isArray(members)) members = [members];
      members.push(user?._id?.toString());
      members = [...new Set(members)];

      const image_url = file ? file?.filename : null;

      const new_group = await Group_Chat.create({
        created_by: user?._id,
        members,
        group_name,
        workspace_id: user?.workspace,
        image_url,
      });

      eventEmitter("GROUP_CREATED", new_group, members, user?.workspace);

      const notification_obj = {
        data_reference_id: new_group?._id,
        from_user: user?._id,
        type: "group",
        workspace_id: user?.workspace,
        group_id: new_group?._id,
      };

      let notification_message = returnNotification("chat", "addedToGroup");

      notification_message = notification_message.replaceAll(
        "{{group_name}}",
        group_name
      );

      notification_message = notification_message.replaceAll(
        "{{creator_name}}",
        capitalizeFirstLetter(user?.first_name) +
          " " +
          capitalizeFirstLetter(user?.last_name)
      );

      members.forEach(async (member) => {
        if (member === user?._id?.toString()) return;

        notification_obj.user_id = member;
        notification_obj.message = notification_message;

        await Notification.create(notification_obj);
        const pending_notification = await Notification.countDocuments({
          $or: [{ type: "chat" }, { type: "group" }],
          user_id: member,
          is_read: false,
          workspace_id: user?.workspace,
        });
        eventEmitter(
          "CHAT_NOTIFICATION",
          {
            notification: notification_obj,
            un_read_count: pending_notification,
          },
          member,
          user?.workspace
        );
        return;
      });

      return;
    } catch (error) {
      logger.error(`Error while creating the group: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // this function is used to convert the array of users object ids to string type object id so we can
  // send socket event to that array of users id
  objectIdToString = (ids) => {
    return ids.map((id) => id.toString());
  };

  groupsList = async (user, payload) => {
    try {
      let queryObj = {};
      if (payload?.search && payload?.search !== "") {
        queryObj = {
          $or: [
            {
              group_name: {
                $regex: payload.search.toLowerCase(),
                $options: "i",
              },
            },
          ],
        };
      }
      const group_ids = await Group_Chat.find({
        workspace_id: user?.workspace,
        members: { $in: [user?._id] },
        is_deleted: false,
        ...queryObj,
      }).sort({ createdAt: -1 });

      const unique_groups_ids = group_ids.map((group_id) =>
        group_id?._id?.toString()
      );

      const [chat_messages, notifications] = await Promise.all([
        Chat.find({
          workspace_id: user?.workspace,
          group_id: { $in: unique_groups_ids },
          is_deleted: false,
        }).sort({ createdAt: -1 }),
        Notification.find({
          type: "group",
          user_id: user?._id,
          group_id: { $in: unique_groups_ids },
          is_read: false,
          is_deleted: false,
          workspace_id: user?.workspace,
        })
          .sort({ createdAt: -1 })
          .lean(),
      ]);

      const updated_group_id = [];
      let final_group_array = [];
      for (let i = 0; i < chat_messages.length; i++) {
        if (
          !updated_group_id.includes(chat_messages[i]?.group_id?.toString())
        ) {
          updated_group_id.push(chat_messages[i]?.group_id?.toString());
          const index = group_ids.findIndex(
            (gid) =>
              gid?._id?.toString() == chat_messages[i]?.group_id?.toString()
          );

          if (index !== -1) {
            const group = group_ids[index];
            const group_obj = {
              group_name: group?.group_name,
              last_message_date: chat_messages[i]?.createdAt,
              last_message: chat_messages[i]?.message,
              createdAt: chat_messages[i]?.createdAt,
              _id: group?._id,
              image_url: group?.image_url,
              message_type: chat_messages[i]?.message_type,
            };

            const unread = notifications.some(
              (noti) =>
                noti?.user_id?.toString() == user?._id?.toString() &&
                noti?.group_id?.toString() == group?._id?.toString()
            );
            if (unread) group_obj["unread"] = true;
            else group_obj["unread"] = false;
            final_group_array.push(group_obj);
            group_ids.splice(index, 1);
          }
        }
      }
      final_group_array = [...final_group_array, ...group_ids];

      final_group_array.sort((a, b) => b.createdAt - a.createdAt);
      return final_group_array;
    } catch (error) {
      logger.error(`Error while fetching the group list: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  chatHistory = async (payload, user) => {
    try {
      await Notification.updateMany(
        {
          group_id: payload?.group_id,
          user_id: user?._id,
          workspace_id: user?.workspace,
        },
        { $set: { is_read: true } }
      );

      const pending_notification = await Notification.countDocuments({
        $or: [{ type: "chat" }, { type: "group" }],
        user_id: user?._id,
        is_read: false,
        workspace_id: user?.workspace,
      });

      eventEmitter(
        "CHAT_NOTIFICATION",
        {
          un_read_count: pending_notification,
        },
        user?._id,
        user?.workspace
      );

      const messages = await Chat.aggregate([
        {
          $match: {
            group_id: new mongoose.Types.ObjectId(payload?.group_id),
            is_deleted: false,
          },
        },
        {
          $lookup: {
            from: "authentications",
            localField: "from_user",
            foreignField: "_id",
            as: "user_detail",
            pipeline: [
              {
                $project: {
                  first_name: 1,
                  last_name: 1,
                  profile_image: 1,
                  _id: 1,
                },
              },
            ],
          },
        },
        { $unwind: { path: "$user_detail", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$reactions", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "authentications", // Collection name of your user model
            localField: "reactions.user",
            foreignField: "_id",
            as: "reactions.user",
            pipeline: [
              {
                $project: {
                  first_name: 1,
                  last_name: 1,
                  profile_image: 1,
                  _id: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$reactions.user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            first_name: "$reactions.user.first_name",
            last_name: "$reactions.user.last_name",
            profile_image: "$reactions.user.profile_image",
            message: 1,
            group_id: 1,
            reactions: 1,
            createdAt: 1,
            document_url: 1,
            image_url: 1,
            audio_url: 1,
            is_deleted: 1,
            message_type: 1,
            _id: 1,
            to_user: 1,
            from_user: 1,
            user_detail: 1,
            original_file_name: 1,
          },
        },
        {
          $group: {
            _id: "$_id",
            message: { $first: "$message" },
            createdAt: { $first: "$createdAt" },
            is_deleted: { $first: "$is_deleted" },
            group_id: { $first: "$group_id" },
            document_url: { $first: "$document_url" },
            image_url: { $first: "$image_url" },
            message_type: { $first: "$message_type" },
            audio_url: { $first: "$audio_url" },
            to_user: { $first: "$to_user" },
            from_user: { $first: "$from_user" },
            user_detail: { $first: "$user_detail" },
            reactions: { $push: "$reactions" }, // Group reactions into an array
          },
        },
      ]).sort({ createdAt: 1 });

      for (let i = 0; i < messages?.length; i++) {
        messages[i].reactions = messages[i].reactions?.filter(
          (item) => Object.keys(item)?.length !== 0
        );
      }
      return messages;
    } catch (error) {
      logger.error(
        `Error while feching the chat history of the group: ${error}`
      );
      return throwError(error?.message, error?.statusCode);
    }
  };

  // update the group by the creator only
  updateGroup = async (payload, file, user) => {
    try {
      const group_exist = await Group_Chat.findOne({
        _id: payload?.group_id,
        created_by: user?._id,
        is_deleted: false,
      }).lean();
      if (!group_exist)
        return throwError(
          returnMessage("chat", "groupDoesNotExist"),
          statusCode?.notFound
        );

      const existingImage = group_exist?.image_url;
      let image_url;
      if (file) {
        image_url = file?.filename;
      } else if (payload?.image_url === "" || (!file && !payload?.image_url)) {
        image_url = null;
        existingImage &&
          fs.unlink(`./src/public/${existingImage}`, (err) => {
            if (err) {
              logger.error(`Error while unlinking the documents: ${err}`);
            }
          });
      }

      group_exist.members = group_exist?.members?.map((member) =>
        member?.toString()
      );
      payload.members.push(user?._id?.toString());
      payload.members = [...new Set(payload?.members)];

      const new_users = [];
      const existing_users = [];

      payload?.members?.forEach((member) =>
        !group_exist?.members.includes(member)
          ? new_users.push(member)
          : existing_users.push(member)
      );

      const removed_users = group_exist?.members?.filter(
        (member) => !payload?.members?.includes(member)
      );

      const updated_group = await Group_Chat.findByIdAndUpdate(
        group_exist?._id,
        {
          group_name: payload?.group_name,
          members: payload?.members,
          image_url,
        },
        { new: true }
      );

      eventEmitter(
        "REMOVED_FROM_GROUP",
        updated_group,
        removed_users,
        user?.workspace
      );

      eventEmitter(
        "GROUP_UPDATED",
        updated_group,
        existing_users,
        user?.workspace
      );

      if (new_users.length > 0) {
        eventEmitter(
          "GROUP_CREATED",
          updated_group,
          new_users,
          user?.workspace
        );

        const notification_obj = {
          data_reference_id: updated_group?._id,
          from_user: user?._id,
          type: "group",
          workspace_id: user?.workspace,
        };

        let notification_message = returnNotification("chat", "addedToGroup");

        notification_message = notification_message.replaceAll(
          "{{group_name}}",
          updated_group?.group_name
        );

        notification_message = notification_message.replaceAll(
          "{{creator_name}}",
          capitalizeFirstLetter(user?.first_name) +
            " " +
            capitalizeFirstLetter(user?.last_name)
        );

        new_users.forEach(async (member) => {
          if (member === user?._id) return;

          notification_obj.user_id = member;
          notification_obj.message = notification_message;

          await Notification.create(notification_obj);

          const pending_notification = await Notification.countDocuments({
            $or: [{ type: "chat" }, { type: "group" }],
            user_id: member,
            is_read: false,
            workspace_id: user?.workspace,
          });

          eventEmitter(
            "CHAT_NOTIFICATION",
            {
              notification: notification_obj,
              un_read_count: pending_notification,
            },
            member,
            user?.workspace
          );
          return;
        });
      }
    } catch (error) {
      logger.error(`Error while updating the group details: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // fetch the group by the id
  getGroup = async (group_id) => {
    try {
      const group = await Group_Chat.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(group_id),
            is_deleted: false,
          },
        },

        {
          $lookup: {
            from: "authentications",
            let: { members: "$members" },
            pipeline: [
              { $match: { $expr: { $in: ["$_id", "$$members"] } } },
              {
                $lookup: {
                  from: "role_masters",
                  let: { role: "$role" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$role"] } } },
                    { $project: { name: 1 } },
                  ],
                  as: "role",
                },
              },
              { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },
              {
                $project: {
                  first_name: 1,
                  last_name: 1,
                  email: 1,
                  role: 1,
                  _id: 1,
                },
              },
            ],
            as: "members",
          },
        },
      ]);

      // {
      //   $lookup: {
      //     from: "authentications",
      //     localField: "members",
      //     foreignField: "reference_id",
      //     as: "members",
      //     pipeline: [
      //       {
      //         $project: {
      //           first_name: 1,
      //           last_name: 1,
      //           reference_id: 1,
      //           _id: 1,
      //         },
      //       },
      //     ],
      //   },
      // },
      if (!group)
        return throwError(
          returnMessage("chat", "groupDoesNotExist"),
          statusCode?.notFound
        );
      return group;
    } catch (error) {
      logger.error(`Error while fetching the group details: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = GroupChatService;
