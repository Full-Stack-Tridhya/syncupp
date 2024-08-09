const Chat = require("../models/chatSchema");
const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const Authentication = require("../models/authenticationSchema");
const Notification = require("../models/notificationSchema");
const mongoose = require("mongoose");
const { returnMessage, paginationObject } = require("../utils/utils");
const {
  eventEmitter,
  oneToOneChatEmailNotification,
  groupChatEmailNotification,
} = require("../socket");
const path = require("path");
const fs = require("fs");
const Workspace = require("../models/workspaceSchema");
class ChatService {
  // this function is used to get hte history between 2 users
  chatHistory = async (payload, user) => {
    try {
      if (!payload?.to_user)
        return throwError(returnMessage("chat", "userIdRequired"));
      const search_obj = {};
      if (payload?.search && payload?.search !== "") {
        search_obj["$or"] = [
          { message: { $regex: payload?.search.toLowerCase(), $options: "i" } },
        ];
      }
      const aggragate = [
        {
          $match: {
            workspace_id: new mongoose.Types.ObjectId(user?.workspace),
            $or: [
              {
                $and: [
                  { from_user: user?._id },
                  { to_user: new mongoose.Types.ObjectId(payload?.to_user) },
                ],
              },
              {
                $and: [
                  { from_user: new mongoose.Types.ObjectId(payload?.to_user) },
                  { to_user: user?._id },
                ],
              },
            ],
            is_deleted: false,
            ...search_obj,
          },
        },
        { $unwind: { path: "$reactions", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "authentications",
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
            original_file_name: 1,
          },
        },
        {
          $group: {
            _id: "$_id",
            message: { $first: "$message" },
            createdAt: { $first: "$createdAt" },
            is_deleted: { $first: "$is_deleted" },
            document_url: { $first: "$document_url" },
            image_url: { $first: "$image_url" },
            audio_url: { $first: "$audio_url" },
            message_type: { $first: "$message_type" },
            to_user: { $first: "$to_user" },
            from_user: { $first: "$from_user" },
            reactions: { $push: "$reactions" },
            original_file_name: { $first: "$original_file_name" },
          },
        },
        { $sort: { createdAt: 1 } },
      ];
      const chats = await Chat.aggregate(aggragate);

      for (let i = 0; i < chats?.length; i++) {
        chats[i].reactions = chats[i].reactions?.filter(
          (item) => Object.keys(item)?.length !== 0
        );
      }

      await Notification.updateMany(
        {
          user_id: user?._id,
          from_user: payload?.to_user,
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
        { un_read_count: pending_notification },
        user?._id,
        user?.workspace
      );

      return chats;
    } catch (error) {
      logger.error(`Erroe while fetching the chat history: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  // this function is used to fetched the all of the users where we have started the chat
  fetchUsersList = async (payload, user) => {
    try {
      const members_ids = user?.workspace_detail?.members?.reduce(
        (acc, member) => {
          if (
            member?.user_id?.toString() !== user?._id?.toString() &&
            member?.status === "confirmed"
          ) {
            acc.push(member?.user_id);
          }
          return acc;
        },
        []
      );

      const chats = await Chat.find({
        workspace_id: user?.workspace,
        $or: [
          {
            $and: [{ from_user: user?._id }, { to_user: { $in: members_ids } }],
          },
          {
            $and: [{ from_user: { $in: members_ids } }, { to_user: user?._id }],
          },
        ],
        is_deleted: false,
      })
        .sort({ createdAt: -1 })
        .lean();

      let chat_users_ids = [];
      const last_message = [];
      chats?.forEach((chat) => {
        if (chat?.from_user?.toString() === user?._id?.toString()) {
          chat_users_ids.push(chat?.to_user?.toString());
          last_message.push(chat);
          return;
        } else if (chat?.to_user?.toString() === user?._id?.toString()) {
          chat_users_ids.push(chat?.from_user?.toString());
          last_message.push(chat);
          return;
        }
        return;
      });

      members_ids?.forEach((id) => {
        if (!chat_users_ids.includes(id?.toString()))
          chat_users_ids.push(id?.toString());
      });

      chat_users_ids = chat_users_ids.map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      let queryObj = { _id: { $in: chat_users_ids }, is_deleted: false };

      if (payload?.search && payload?.search !== "") {
        queryObj["$or"] = [
          {
            name: { $regex: payload.search.toLowerCase(), $options: "i" },
          },
          {
            first_name: {
              $regex: payload.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            last_name: {
              $regex: payload.search.toLowerCase(),
              $options: "i",
            },
          },
        ];
      }

      const chatPipeline = [
        { $match: queryObj },
        {
          $project: {
            first_name: 1,
            last_name: 1,
            image_url: 1,
            name: { $concat: ["$first_name", " ", "$last_name"] },
            email: 1,
            is_online: 1,
            _id: 1,
            profile_image: 1,
            createdAt: 1,
            updatedAt: 1,
            contact_number: 1,
          },
        },
      ];

      const [unread_messages, users] = await Promise.all([
        Notification.find({
          user_id: user?._id,
          from_user: { $in: chat_users_ids },
          type: "chat",
          is_read: false,
          workspace_id: user?.workspace,
        }).lean(),
        Authentication.aggregate(chatPipeline),
      ]);

      // it will used to get is there any messages that are un-seen
      users?.forEach((usr) => {
        const unread = unread_messages.some(
          (noti) =>
            noti?.from_user?.toString() === usr?._id?.toString() &&
            noti?.user_id?.toString() === user?._id?.toString()
        );
        if (unread) usr["unread"] = true;
        else usr["unread"] = false;

        const last_chat = last_message.find(
          (message) =>
            (message?.from_user?.toString() == user?._id?.toString() &&
              message?.to_user?.toString() == usr?._id?.toString()) ||
            (message?.to_user?.toString() == user?._id?.toString() &&
              message?.from_user?.toString() == usr?._id?.toString())
        );

        if (last_chat) {
          usr["last_message_date"] = last_chat?.createdAt;
          usr["createdAt"] = last_chat?.createdAt;
          usr["last_message"] = last_chat?.message;
          usr["message_type"] = last_chat?.message_type;
        }
        return;
      });

      users.sort((a, b) => b?.createdAt - a?.createdAt);

      return users;
    } catch (error) {
      logger.error(`Error while fetching the users list: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  uploadImage = async (payload, file, user) => {
    try {
      const chat_obj = {
        workspace_id: user?.workspace,
        from_user: payload?.from_user,
        message_type: "image",
      };

      if (file) {
        chat_obj.image_url = file?.filename;
        chat_obj.original_file_name = file?.originalname;
      }

      let user_detail, event_name, receivers;
      if (payload?.to_user) {
        chat_obj.to_user = payload?.to_user;
        event_name = "RECEIVED_IMAGE";
        receivers = [payload?.from_user, payload?.to_user];

        oneToOneChatEmailNotification({
          from_user: payload?.from_user,
          to_user: payload?.to_user,
          workspace_id: user?.workspace,
          message: "A new image has been shared.",
        });
      } else if (payload?.group_id) {
        chat_obj.group_id = payload?.group_id;
        user_detail = await Authentication.findById(payload?.from_user)
          .select("first_name last_name profile_image")
          .lean();
        event_name = "GROUP_RECEIVED_IMAGE";
        receivers = payload?.group_id;

        groupChatEmailNotification({
          from_user: payload?.from_user,
          group_id: payload?.group_id,
          message: "A new image has been shared.",
          workspace_id: user?.workspace,
        });
      }

      let new_message = await Chat.create(chat_obj);
      new_message = new_message.toJSON();
      const socket_obj = { ...new_message, user_detail };

      eventEmitter(event_name, socket_obj, receivers, user?.workspace);
      return;
    } catch (error) {
      logger.error(`Error while uploading the image: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };

  uploadDocument = async (payload, file, user) => {
    try {
      const chat_obj = {
        workspace_id: user?.workspace,
        from_user: payload?.from_user,
        message_type: "document",
      };

      if (file) {
        chat_obj.document_url = file?.filename;
        chat_obj.original_file_name = file?.originalname;
      }

      let user_detail, event_name, receivers;
      if (payload?.to_user) {
        chat_obj.to_user = payload?.to_user;
        event_name = "RECEIVED_DOCUMENT";
        receivers = [payload?.from_user, payload?.to_user];
        oneToOneChatEmailNotification({
          from_user: payload?.from_user,
          to_user: payload?.to_user,
          workspace_id: user?.workspace,
          message: "A new Document has been shared.",
        });
      } else if (payload?.group_id) {
        chat_obj.group_id = payload?.group_id;
        user_detail = await Authentication.findById(payload?.from_user)
          .select("first_name last_name profile_image")
          .lean();
        event_name = "GROUP_RECEIVED_DOCUMENT";
        receivers = payload?.group_id;

        groupChatEmailNotification({
          from_user: payload?.from_user,
          group_id: payload?.group_id,
          message: "A new Document has been shared.",
          workspace_id: user?.workspace,
        });
      }

      let new_message = await Chat.create(chat_obj);
      new_message = new_message.toJSON();
      const socket_obj = { ...new_message, user_detail };

      eventEmitter(event_name, socket_obj, receivers, user?.workspace);

      return;
    } catch (error) {
      logger.error(`Error while uploading the image: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
  // upload audio and change blob inot mp3 file
  uploadAudio = async (payload, file, user) => {
    try {
      const chat_obj = {
        workspace_id: user?.workspace,
        from_user: payload?.from_user,
        message_type: "audio",
      };

      if (file) {
        // Convert Blob data to Buffer
        const buffer = Buffer.from(file?.buffer, "base64");

        // Assuming you have a directory named 'uploads' to store audio files
        const filePath = path.join(
          __dirname,
          "../",
          "public",
          "uploads",
          `${Date.now()}_audio.mp3`
        );

        // Save the buffer to a file
        fs.writeFileSync(filePath, buffer);
        let audio_Path = this.getFileName(filePath);
        // Store the file path in the chat_obj
        chat_obj.audio_url = audio_Path;
      }

      let user_detail, event_name, receivers;
      if (payload?.to_user) {
        chat_obj.to_user = payload?.to_user;
        event_name = "RECEIVED_AUDIO";
        receivers = [payload?.from_user, payload?.to_user];
        oneToOneChatEmailNotification({
          from_user: payload?.from_user,
          to_user: payload?.to_user,
          workspace_id: user?.workspace,
          message: "A new Audio has been shared.",
        });
      } else if (payload?.group_id) {
        chat_obj.group_id = payload?.group_id;
        user_detail = await Authentication.findById(payload?.from_user)
          .select("first_name last_name reference_id")
          .lean();
        event_name = "GROUP_RECEIVED_AUDIO";
        receivers = payload?.group_id;
        groupChatEmailNotification({
          from_user: payload?.from_user,
          group_id: payload?.group_id,
          message: "A new Audio has been shared.",
          workspace_id: user?.workspace,
        });
      }

      let new_message = await Chat.create(chat_obj);
      new_message = new_message.toJSON();
      const socket_obj = { ...new_message, user_detail };

      eventEmitter(event_name, socket_obj, receivers, user?.workspace);

      return;
    } catch (error) {
      logger.error(`Error while uploading the Audio: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
  getFileName = (filePath) => {
    // Split the file path by backslashes (for Windows paths) or forward slashes (for Unix-like paths)
    const parts = filePath.split(/[\\/]/);
    // Return the last part of the split array, which should be the filename
    return parts[parts.length - 1];
  };

  getAllDocuments = async (payload, user) => {
    try {
      const pagination = paginationObject(payload);
      const query_obj = { workspace_id: user?.workspace, is_deleted: false };
      const search_obj = {};
      if (payload?.document_type === "images") {
        query_obj["message_type"] = "image";
      } else if (payload?.document_type === "documents") {
        query_obj["message_type"] = "document";
      }

      if (payload?.search && payload?.search !== "") {
        search_obj["$or"] = [
          { original_file_name: { $regex: payload.search, $options: "i" } },
        ];
      }
      if (payload?.group_id) {
        query_obj["group_id"] = payload?.group_id;
      }

      if (payload?.to_user)
        query_obj["$or"] = [
          {
            $and: [{ from_user: user?._id }, { to_user: payload?.to_user }],
          },
          {
            $and: [{ to_user: user?._id }, { from_user: payload?.to_user }],
          },
        ];

      const [documents, total_documents] = await Promise.all([
        Chat.find({ ...query_obj, ...search_obj })
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page)
          .lean(),
        Chat.find({ ...query_obj, ...search_obj }).lean(),
      ]);

      const docs = [];
      documents.forEach((doc) => {
        if (doc?.message_type === "image")
          docs.push({
            image: doc?.image_url,
            original_file_name: doc?.original_file_name,
          });
        else if (doc?.message_type === "document")
          docs.push({
            document: doc?.document_url,
            original_file_name: doc?.original_file_name,
          });
      });
      return {
        docs,
        page_count:
          Math.ceil(total_documents.length / pagination.result_per_page) || 0,
      };
    } catch (error) {
      logger.error(`Error while getting all documents: ${error}`);
      return throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = ChatService;
