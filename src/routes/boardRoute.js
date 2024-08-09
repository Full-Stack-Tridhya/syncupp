const {
  protect,
  authorizeMultipleRoles,
} = require("../middlewares/authMiddleware");
const boardRoute = require("express").Router();
const { validateCreateBoard } = require("../validators/board.validator");
const validatorFunc = require("../utils/validatorFunction.helper");
const boardController = require("../controllers/boardController");
const { checkProfileSize, upload } = require("../helpers/multer");

boardRoute.use(protect);

boardRoute.post(
  "/create-board",
  checkProfileSize,
  upload.single("board_image"),
  validateCreateBoard,
  validatorFunc,
  boardController.addBoard
);
boardRoute.put("/pin-status", boardController.changePinStatus);

boardRoute.put(
  "/:id",
  checkProfileSize,
  upload.single("board_image"),
  boardController.updateBoard
);

boardRoute.get("/fetch-users", boardController.allUserList);
boardRoute.post("/get-boards", boardController.listBoards);
boardRoute.get("/:id", boardController.getBoard);
boardRoute.get("/member-list/:id", boardController.memberList);
boardRoute.post("/add-remove-user", boardController.addRemoveMember);
boardRoute.get("/image/board-images", boardController.fetchBoardImage);
boardRoute.post("/delete-board", boardController.deleteBoard);
boardRoute.post("/status-update", boardController.updateBoardStatus);

module.exports = boardRoute;
