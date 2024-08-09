const loginAdmin = {
  tags: ["Admin Panel"],
  description: "",
  summary: "Login Admin ",
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
            email: {
              type: "string",
              description: "Enter email id",
              required: true,
            },
            password: {
              type: "string",
              description: "Enter password",
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
const forgotAdminPassword = {
  tags: ["Admin Panel"],
  description: "",
  summary: "Admin Forgot Password ",
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
            email: {
              type: "string",
              description: "Enter email id",
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
const resetAdminPassword = {
  tags: ["Admin Panel"],
  description: "",
  summary: "Reset Admin Password ",
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
            email: {
              type: "string",
              description: "Enter email id",
              required: true,
            },
            newPassword: {
              type: "string",
              description: "Enter password",
              required: true,
            },
            token: {
              type: "string",
              description: "Enter token",
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

const updateAdminPassword = {
  tags: ["Admin Panel"],
  description: "",
  summary: "Update Admin Password ",
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
            oldPassword: {
              type: "string",
              description: "Enter email id",
              required: true,
            },
            newPassword: {
              type: "string",
              description: "Enter password",
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

const updateAdminProfile = {
  tags: ["Admin Panel"],
  description: "",
  summary: "Update Admin Profile ",
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
            first_name: {
              type: "string",
              description: "Enter first name",
            },
            last_name: {
              type: "string",
              description: "Enter last name",
            },
            contact_no: {
              type: "number",
              description: "Enter contact number",
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
const getAdminProfile = {
  tags: ["Admin Panel"],
  description: "",
  summary: "Get Admin Profile ",
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

const agencyList = {
  tags: ["Admin Panel"],
  description: "",
  summary: "Agency List",
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

const updateAgencyStatus = {
  tags: ["Admin Panel"],
  description: "",
  summary: "Update or Delete Agency",
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
            agencies: {
              type: "array",
              description: "Enter list of agency id in the array.",
              default: [],
            },
            status: {
              type: "string",
              description:
                "Enter status of the agency. either active or inactive.",
              default: "inactive",
            },
            delete: {
              type: "boolean",
              description: "Enter true or false.",
              default: false,
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

const getAgencyProfile = {
  tags: ["Admin Panel"],
  description: "",
  summary: "Get Agency Profile",
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
            _id: {
              type: "string",
              description: "Enter _id.",
            },
            reference_id: {
              type: "string",
              description: "Enter reference_id.",
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
            sortField: {
              type: "string",
              description: "Enter sortField",
              required: true,
            },
            sortOrder: {
              type: "string",
              description: "Enter sortOrder",
              required: true,
            },
            page: {
              type: "number",
              description: "Enter page number",
              required: true,
            },
            itemsPerPage: {
              type: "number",
              description: "Enter itemsPerPage",
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

const getTransactions = {
  tags: ["Admin Panel"],
  description:
    "sortOrder = (asc ,desc)  ,sortField = (name , subscription and order id)  , page  = (number) , itemsPerPage=(number))",
  summary: "Get All Transactions ",
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
              default: 5,
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
            agency_id: { type: "string" },
            subscription_id: { type: "string" },
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

const getDashboard = {
  tags: ["Admin Panel"],
  description: "",
  summary: "Get Dashboard Data ",
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

const extendTrialDate = {
  tags: ["Admin Panel"],
  description: "",
  summary: "Update the trial end date",
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
            trial_end_date: { type: "DD-MM-YYYY", required: true },
            agency_id: { type: "string", required: true },
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

const adminRoutes = {
  "/api/v1/admin/login": {
    post: loginAdmin,
  },
  "/api/v1/admin/forgotPassword": {
    post: forgotAdminPassword,
  },
  "/api/v1/admin/resetPassword": {
    post: resetAdminPassword,
  },
  "/api/v1/admin/updatePassword": {
    put: updateAdminPassword,
  },
  "/api/v1/admin/getProfile": {
    get: getAdminProfile,
  },
  "/api/v1/admin/updateProfile": {
    put: updateAdminProfile,
  },
  "/api/v1/admin/add-faq": {
    post: addFaqAdmin,
  },
  "/api/v1/admin/get-all-faq": {
    get: getAllFaq,
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
  "/api/v1/admin/agencies": {
    post: agencyList,
  },
  "/api/v1/admin/agency": {
    get: getAgencyProfile,
  },
  "/api/v1/admin/update-agency": {
    patch: updateAgencyStatus,
  },
  "/api/v1/admin/transaction": {
    post: getTransactions,
  },
  "/api/v1/admin/dashboard": {
    get: getDashboard,
  },
  "/api/v1/admin/extend-trial": {
    patch: extendTrialDate,
  },
};

module.exports = adminRoutes;
