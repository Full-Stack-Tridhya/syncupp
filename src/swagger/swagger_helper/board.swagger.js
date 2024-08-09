const addBoard = {
  tags: ["Board"],
  description: "",
  summary: "Add Board  ",
  security: [
    {
      bearerAuth: [],
    },
  ],
  requestBody: {
    content: {
      "multipart/form-data": {
        schema: {
          type: "object",
          properties: {
            project_name: {
              type: "string",
              description: "Enter Project name",
            },
            description: {
              type: "string",
              description: "Enter Description",
            },
            members: {
              type: "array",
              description: "Please add members ids",
            },

            board_image: {
              type: "string",
              format: "binary",
              description: "Please board_image",
              required: false,
            },
          },
        },
      },
    },
  },

  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    },
  },
};

const updateBoard = {
  tags: ["Board"],
  description: "",
  summary: "Update Board  ",
  security: [
    {
      bearerAuth: [],
    },
  ],
  requestBody: {
    content: {
      "multipart/form-data": {
        schema: {
          type: "object",
          properties: {
            project_name: {
              type: "string",
              description: "Enter Project name",
            },
            description: {
              type: "string",
              description: "Enter Description",
            },
            members: {
              type: "array",
              description: "Please add members ids",
            },

            board_image: {
              type: "string",
              format: "binary",
              description: "Please board_image",
              required: false,
            },
          },
        },
      },
    },
  },
  parameters: [
    {
      name: "id",
      in: "path", // or "query" depending on your use case
      description: "ID of the board",
      required: true,
      schema: {
        type: "string", // adjust the type accordingly
      },
    },
  ],
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    },
  },
};

const changePinStatus = {
  tags: ["Board"],
  description: "",
  summary: "Change pin status",
  security: [
    {
      bearerAuth: [],
    },
  ],
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            is_pinned: {
              type: "string",
              description: "Enter status",
              required: true,
            },
            board_id: {
              type: "string",
              description: "Enter board id",
              required: true,
            },
          },
        },
      },
    },
  },

  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    },
  },
};

const getBoard = {
  tags: ["Board"],
  description: "",
  summary: "Get Board",
  security: [
    {
      bearerAuth: [],
    },
  ],

  parameters: [
    {
      name: "id",
      in: "path", // or "query" depending on your use case
      description: "ID of the board",
      required: true,
      schema: {
        type: "string", // adjust the type accordingly
      },
    },
  ],
  requestBody: {},

  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    },
  },
};

const getBoardList = {
  tags: ["Board"],
  description: "sort : [ `newest` , `oldest` , `asc`,`desc`]",
  summary: "Get Board list  ",
  security: [
    {
      bearerAuth: [],
    },
  ],
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            all: {
              type: "boolean",
              description: "Enter sortOrder",
              default: false,
            },
            skip: {
              type: "number",
              description: "Enter skip number",
              default: 0,
              required: true,
            },
            limit: {
              type: "number",
              description: "Enter limit number",
              default: 0,
              required: true,
            },
            sort: {
              type: "string",
              description: "Enter sort by",
            },
          },
        },
      },
    },
  },

  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    },
  },
};
const memberList = {
  tags: ["Board"],
  description: "",
  summary: "Member list",
  security: [
    {
      bearerAuth: [],
    },
  ],

  requestBody: {},

  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    },
  },
};

const userList = {
  tags: ["Board"],
  description: "",
  summary: "Member list",
  security: [
    {
      bearerAuth: [],
    },
  ],

  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    },
  },
};
const boardImage = {
  tags: ["Board"],
  description: "",
  summary: "Member list",
  security: [
    {
      bearerAuth: [],
    },
  ],

  parameters: [
    {
      name: "id",
      in: "path", // or "query" depending on your use case
      description: "ID of the board",
      required: true,
      schema: {
        type: "string", // adjust the type accordingly
      },
    },
  ],
  requestBody: {},

  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    },
  },
};

const addRemoveUser = {
  tags: ["Board"],
  description: "action_name : [ `add` , `remove`]",
  summary: "Member list",
  security: [
    {
      bearerAuth: [],
    },
  ],

  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            member_id: {
              type: "string",
              description: "Enter member id",
              required: true,
            },
            board_id: {
              type: "string",
              description: "Enter board id",
              required: true,
            },
            action_name: {
              type: "string",
              description: "Enter action name",
              required: true,
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    },
  },
};

const deleteBoard = {
  tags: ["Board"],
  description: "",
  summary: "Delete a board",
  security: [
    {
      bearerAuth: [],
    },
  ],

  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            board_id: {
              type: "string",
              description: "Enter board_id",
              required: true,
            },
            force_fully_remove: {
              type: "boolean",
              description: "Enter force_fully_remove",
              required: true,
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    },
  },
};

const archiveBoard = {
  tags: ["Board"],
  description: "",
  summary: "Archive a board",
  security: [
    {
      bearerAuth: [],
    },
  ],

  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            board_id: {
              type: "string",
              description: "Enter board_id",
              required: true,
            },
            status: {
              type: "string",
              description: "Enter status",
              required: true,
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    },
  },
};

const boardRoutes = {
  "/api/v1/board/create-board": {
    post: addBoard,
  },

  "/api/v1/board/pin-status": {
    put: changePinStatus,
  },
  "/api/v1/board/{id}": {
    get: getBoard,
    put: updateBoard,
  },
  "/api/v1/board/get-boards": {
    post: getBoardList,
  },
  "/api/v1/board/member-list/{id}": {
    get: memberList,
  },
  "/api/v1/board/fetch-users": {
    get: userList,
  },
  "/api/v1/board/board-images": {
    get: boardImage,
  },
  "/api/v1/board/add-remove-user": {
    post: addRemoveUser,
  },
  "/api/v1/board/delete-board": {
    post: deleteBoard,
  },
  "/api/v1/board/status-update": {
    post: archiveBoard,
  },
};

module.exports = boardRoutes;
