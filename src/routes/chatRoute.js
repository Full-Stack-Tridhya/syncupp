const chatRoute = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const chatController = require("../controllers/chatController");
const { upload, audio_upload } = require("../helpers/multer");

chatRoute.use(protect);
chatRoute.post("/users", chatController.fetchUsersList);
chatRoute.post("/history", chatController.chatHistory);
chatRoute.get("/group/users", chatController.fetchUsers);
chatRoute.post(
  "/group/create",
  upload.single("group_image"),
  chatController.createGroup
);
chatRoute.post("/groups", chatController.groups);
chatRoute.post("/group/history", chatController.groupChatHistory);
chatRoute.patch(
  "/group/update",
  upload.single("group_image"),
  chatController.updateGroup
);
chatRoute.get("/group/:groupId", chatController.getGroup);
chatRoute.post(
  "/upload-image",
  upload.single("image"),
  chatController.uploadImage
);
chatRoute.post(
  "/upload-document",
  upload.single("document"),
  chatController.uploadDocument
);
chatRoute.post(
  "/upload-audio",
  audio_upload.single("audio_blob_data"),
  chatController.uploadAudio
);

chatRoute.post("/documents", chatController.getAllDocuments);

module.exports = chatRoute;
