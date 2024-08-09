const createTask = {
  tags: ["Task - CRM Panel"],
  description: "",
  summary: "Create Task",
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
            title: {
              type: "string",
              required: true,
            },
            agenda: {
              type: "string",
              required: true,
            },
            board_id: {
              type: "string",
              required: true,
            },
            priority: {
              type: "string",
              required: true,
            },
            due_date: {
              type: "string",
            },
            assign_to: {
              type: "array",
              items: {
                type: "string",
              },
              example: [32.3046505, 30.6080822],
            },
            location: {
              type: "array",
              items: {
                type: "array",
              },
              example: [32.3046505, 30.6080822],
            },
            status: {
              type: "string",
              required: true,
            },
            mark_as_done: {
              type: "boolean",
              default: false,
            },
            attachments: {
              type: "string",
              format: "binary",
              description: "Please attach attachments",
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

const updateTask = {
  tags: ["Task - CRM Panel"],
  description: "",
  summary: "Update Task",
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
            title: {
              type: "string",
              required: true,
            },
            agenda: {
              type: "string",
              required: true,
            },
            board_id: {
              type: "string",
              required: true,
            },
            priority: {
              type: "string",
              required: true,
            },
            due_date: {
              type: "string",
            },
            assign_to: {
              type: "array",
              items: {
                type: "string",
              },
              example: [32.3046505, 30.6080822],
            },
            location: {
              type: "array",
              items: {
                type: "array",
              },
              example: [32.3046505, 30.6080822],
            },
            status: {
              type: "string",
              required: true,
            },
            mark_as_done: {
              type: "boolean",
              default: false,
            },
            attachments: {
              type: "string",
              format: "binary",
              description: "Please attach attachments",
            },
          },
        },
      },
    },
  },
  parameters: [
    {
      name: "taskId",
      in: "path", // or "query" depending on your use case
      description: "ID of the task",
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

const addComment = {
  tags: ["Task - CRM Panel"],
  description: "",
  summary: "Add Task comment",
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
            task_id: {
              type: "string",
              required: true,
            },
            comment: {
              type: "string",
              required: true,
            },
          },
        },
      },
    },
  },
  parameters: [
    {
      name: "taskId",
      in: "path", // or "query" depending on your use case
      description: "ID of the task",
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
const listComment = {
  tags: ["Task - CRM Panel"],
  description: "",
  summary: "List comment",
  security: [
    {
      bearerAuth: [],
    },
  ],
  parameters: [
    {
      name: "taskId",
      in: "path", // or "query" depending on your use case
      description: "ID of the task",
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
const leaveTask = {
  tags: ["Task - CRM Panel"],
  description: "",
  summary: "Leave Task",
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
            task_id: {
              type: "string",
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
const deleteTask = {
  tags: ["Task - CRM Panel"],
  description: "",
  summary: "Delete Task",
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
            taskIdsToDelete: {
              type: "array",
              description: "Enter Task IDS to be delete",
              default: [],
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
const TaskStatusUpdate = {
  tags: ["Task - CRM Panel"],
  description: "",
  summary: "Update status Task",
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
            status: {
              type: "string",
              description: "Enter status ID",
              default: [],
            },
          },
        },
      },
    },
  },

  parameters: [
    {
      name: "taskId",
      in: "path", // or "query" depending on your use case
      description: "ID of the task",
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
const getTask = {
  tags: ["Task - CRM Panel"],
  description: "",
  summary: "Get Task",
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
            taskIdsToDelete: {
              type: "array",
              description: "Enter Task IDS to be delete",
              default: [],
            },
          },
        },
      },
    },
  },

  parameters: [
    {
      name: "taskId",
      in: "path", // or "query" depending on your use case
      description: "ID of the task",
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
const taskList = {
  tags: ["Task - CRM Panel"],
  description:
    "filter : [ `competed` , `in_completed` , `my_task`,`due_next_week`,`due_this_week`]",
  summary: "List Task",
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
            page: {
              type: "number",
              description: "Enter page",
              default: 1,
            },
            items_per_page: {
              type: "number",
              description: "Enter items_per_page",
              default: 10,
            },
            sort_field: {
              type: "string",
              description: "Enter sort field",
            },
            sort_order: {
              type: "string",
              description: "Enter sort_order",
            },
            board_id: {
              type: "string",
              description: "Enter board_id",
            },
            filter: {
              type: "string",
              description: "Enter filter",
            },
            pagination: {
              type: "boolean",
              description: "Enter filter",
              default: false,
            },
            search: {
              type: "string",
              description: "Enter search",
            },
            task_count: {
              type: "number",
              description: "Enter task_count",
              default: 5,
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
const taskRoute = {
  "/api/v1/task/create-task": {
    post: createTask,
  },
  "/api/v1/task/update-task/{taskId}": {
    put: updateTask,
  },
  "/api/v1/task/add-comment": {
    post: addComment,
  },
  "/api/v1/task/list-comments/{taskId}": {
    get: listComment,
  },
  "/api/v1/task/leave-task": {
    post: leaveTask,
  },
  "/api/v1/task/delete-task": {
    delete: deleteTask,
  },
  "/api/v1/task/update-status/{taskId}": {
    post: TaskStatusUpdate,
  },
  "/api/v1/task/get-task/{taskId}": {
    get: getTask,
  },
  "/api/v1/task/task-list": {
    post: taskList,
  },
};

module.exports = taskRoute;
