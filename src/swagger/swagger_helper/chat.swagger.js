const chatHistory = {
  tags: ["Chat - CRM Panel"],
  description: "",
  summary: "Fetch Chat history betweeen 2 users.",
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
            to_user: { type: "string", required: true },
            search: { type: "string" },
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

const usersList = {
  tags: ["Chat - CRM Panel"],
  description: "",
  summary: "Fetch users list for the chat",
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
            for: { type: "string" },
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

const getDocuments = {
  tags: ["Chat - CRM Panel"],
  description: "",
  summary: "Fetch documents of the group and one to one chat",
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
              description: "Enter page number.",
              default: 1,
            },
            items_per_page: {
              type: "number",
              description: "Enter item per page.",
              default: 10,
            },
            sort_order: {
              type: "string",
              description: "Enter order of sort asc or desc.",
              default: "desc",
            },
            sort_field: {
              type: "string",
              description: "Enter field to sort.",
              default: "createdAt",
            },
            search: {
              type: "string",
              description: "Enter value of search",
            },
            group_id: { type: "String" },
            to_user: { type: "String" },
            document_type: { type: "String", default: "images" },
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

const chatRoute = {
  "/api/v1/chat/history": { post: chatHistory },
  "/api/v1/chat/users": { post: usersList },
  "/api/v1/chat/documents": { post: getDocuments },
};

module.exports = chatRoute;
