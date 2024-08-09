const addAgreementAdmin = {
  tags: ["Agreement"],
  description: "status : [`draft` , `sent`]",
  summary: "Add Agreement ",
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
          required: ["client_id", "due_date", "status"], // Specify required fields
          properties: {
            client_id: {
              type: "string",
              description: "The client id.",
              required: true,
            },
            title: {
              type: "string",
              description: "The title.",
              required: true,
            },
            receiver: {
              type: "string",
              description: "The due date of the agreement.",
              required: true,
            },
            due_date: {
              type: "string",
              description: "The due date of the agreement.",
              required: true,
            },
            status: {
              type: "string",
              description: "The status of the agreement.",
              required: true,
            },
            agreement_content: {
              type: "string",
              description: "The agreement_content of the agreement.",
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

const getAllAgreement = {
  tags: ["Agreement"],
  description:
    "sortOrder : [`asc` , `desc`] ,  sortField : [`title` , `receiver` , `due_date` , `status`]   ,    page :[`number`] , itemsPerPage:[`number`] ))",
  summary: "Get All Agreement  ",
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
            },
            sortOrder: {
              type: "string",
              description: "Enter sortOrder",
            },
            page: {
              type: "number",
              description: "Enter page number",
              example: 1,
            },
            itemsPerPage: {
              type: "number",
              description: "Enter itemsPerPage",
              example: 10,
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

const deleteAgreement = {
  tags: ["Agreement"],
  description: " ",
  summary: "delete Agreement  ",

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
      description: "ID of the agreement",
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

const updateAgreement = {
  tags: ["Agreement"],
  description: "status : [`draft` , `sent`]",
  summary: "Update Agreement ",
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
              description: "The title.",
              required: true,
            },
            receiver: {
              type: "string",
              description: "The due date of the agreement.",
              required: true,
            },
            due_date: {
              type: "string",
              description: "The due date of the agreement.",
              required: true,
            },
            status: {
              type: "string",
              description: "The status of the agreement.",
              required: true,
            },
            agreement_content: {
              type: "string",
              description: "The agreement_content of the agreement.",
              required: true,
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
      description: "ID of the agreement",
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

const getAgreement = {
  tags: ["Agreement"],
  description: "",
  summary: "Get Agreement ",
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
      description: "ID of agreement",
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

const updateAgreementStatus = {
  tags: ["Agreement"],
  description: "status : [`agreed`]",
  summary: "Update Agreement status ",
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
              description: "Enter status",
              example: "agreed",
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
      description: "ID of the agreement",
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

const sendAgreement = {
  tags: ["Agreement"],
  description: "",
  summary: "Send Agreement ",
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
            agreementId: {
              type: "string",
              description: "Enter status",
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

const getAllClientAgreement = {
  tags: ["Agreement"],
  description:
    "sortOrder : [`asc` , `desc`] ,  sortField : [`title` , `receiver` , `due_date` , `status`]   ,    page :[`number`] , itemsPerPage:[`number`]))",
  summary: "Get All Agreement  ",
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
            agency_id: {
              type: "string",
              description: "Enter agency_id",
            },
            sortField: {
              type: "string",
              description: "Enter sortField",
            },
            sortOrder: {
              type: "string",
              description: "Enter sortOrder",
            },
            page: {
              type: "number",
              description: "Enter page number",
              example: 1,
            },
            itemsPerPage: {
              type: "number",
              description: "Enter itemsPerPage",
              example: 10,
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

const downloadAgreement = {
  tags: ["Agreement"],
  description: "",
  summary: "Download Agreement ",
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
      description: "ID of agreement",
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
        "application/pdf": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
      },
    },
  },
};

const agreementRoutes = {
  "/api/v1/agency/agreement/add-agreement": {
    post: addAgreementAdmin,
  },
  "/api/v1/agency/agreement/get-all-agreement": {
    post: getAllAgreement,
  },
  "/api/v1/agency/agreement/delete-agreement/{id}": {
    delete: deleteAgreement,
  },
  "/api/v1/agency/agreement/get-agreement/{id}": {
    get: getAgreement,
  },
  "/api/v1/agency/agreement/update-agreement/{id}": {
    put: updateAgreement,
  },
  "/api/v1/agency/agreement/send-agreement": {
    post: sendAgreement,
  },
  "/api/v1/client/agreement/get-agreement/{id}": {
    get: getAgreement,
  },
  "/api/v1/client/agreement/update-agreement-status/{id}": {
    put: updateAgreementStatus,
  },

  "/api/v1/client/agreement/get-all-agreement": {
    post: getAllClientAgreement,
  },
  "/api/v1/agency/agreement/download-pdf/{id}": {
    get: downloadAgreement,
  },
};

module.exports = agreementRoutes;
