const addFaqAdmin = {
  tags: ["Admin Panel"],
  description: "",
  summary: "Add FAQ ",
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
            title: {
              type: "string",
              description: "Enter title",
            },
            description: {
              type: "string",
              description: "Enter description",
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

const getAllFaq = {
  tags: ["Admin Panel"],
  description:
    "sortOrder = (asc ,desc)  ,sortField = (name ,email , contact_no)  , page  = (number) , itemsPerPage=(number))",
  summary: "Get All FAQ ",
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

const deleteFaq = {
  tags: ["Admin Panel"],
  description:
    'Pass data like this {"faqIdsToDelete" : ["6597aeb9528e7bc34319c6f7" , "6597b11b248ca49192fcb7b9"]}',
  summary: "Delete FAQ ",
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
            faqIdsToDelete: {
              type: "array",
              description: "Enter FQA IDS to be delete",
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

const updateFaqAdmin = {
  tags: ["Admin Panel"],
  description: "",
  summary: "Update FAQ ",
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
            title: {
              type: "string",
              description: "Enter title",
            },
            description: {
              type: "string",
              description: "Enter description",
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
      description: "ID of the team member",
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

const getFaqAdmin = {
  tags: ["Admin Panel"],
  description: "",
  summary: "Get FAQ ",
  security: [
    {
      bearerAuth: [],
    },
  ],
  requestBody: {},
  parameters: [
    {
      name: "id",
      in: "path", // or "query" depending on your use case
      description: "ID of the team member",
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

const faqRoutes = {
  "/api/v1/admin/add-faq": {
    post: addFaqAdmin,
  },
  "/api/v1/admin/get-all-faq": {
    post: getAllFaq,
  },
  "/api/v1/admin/delete-faq": {
    delete: deleteFaq,
  },
  "/api/v1/admin/get-faq/{id}": {
    get: getFaqAdmin,
  },
  "/api/v1/admin/update-faq/{id}": {
    put: updateFaqAdmin,
  },
};

module.exports = faqRoutes;
