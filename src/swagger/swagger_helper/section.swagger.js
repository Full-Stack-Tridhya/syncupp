const createSection = {
  tags: ["Section"],
  description: "",
  summary: "Create section",

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
            section_name: {
              type: "string",
              description: "Enter Section Name",
              required: true,
            },
            sort_order: {
              type: "number",
              description: "Enter section order",
              required: true,
            },
            board_id: {
              type: "string",
              description: "Enter Board Id",
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

const updateSection = {
  tags: ["Section"],
  description: "",
  summary: "Update section",

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
            section_name: {
              type: "string",
              description: "Enter Section Name",
              required: true,
            },
            sort_order: {
              type: "number",
              description: "Enter section order",
              required: true,
            },
            board_id: {
              type: "string",
              description: "Enter Board Id",
              required: true,
            },
            section_id: {
              type: "string",
              description: "Enter Section Id",
              required: true,
            },
          },
        },
      },
    },
  },
  parameters: [
    {
      name: "section_id",
      in: "path", // or "query" depending on your use case
      description: "section_id of the section",
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
const getAllSection = {
  tags: ["Section"],
  description: "",
  summary: "Get All section",

  security: [
    {
      bearerAuth: [],
    },
  ],

  parameters: [
    {
      name: "board_id",
      in: "path", // or "query" depending on your use case
      description: "board_id of the section",
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
const getSection = {
  tags: ["Section"],
  description: "",
  summary: "Get All section",

  security: [
    {
      bearerAuth: [],
    },
  ],

  parameters: [
    {
      name: "section_id",
      in: "path", // or "query" depending on your use case
      description: "section_id of the section",
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
const deleteSection = {
  tags: ["Section"],
  description: "",
  summary: "Delete section",

  security: [
    {
      bearerAuth: [],
    },
  ],

  parameters: [
    {
      name: "section_id",
      in: "path", // or "query" depending on your use case
      description: "section_id of the section",
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

const sectionRoutes = {
  "/api/v1/section/create-section": {
    post: createSection,
  },
  "/api/v1/section/update-section/{section_id}": {
    put: updateSection,
  },
  "/api/v1/section/get-all/{board_id}": {
    get: getAllSection,
  },

  "/api/v1/section/{section_id}": {
    delete: deleteSection,
    get: getSection,
  },
};

module.exports = sectionRoutes;
