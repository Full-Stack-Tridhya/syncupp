const getClients = {
  tags: ["Invoice"],
  description: "",
  summary: "Get Clients ",
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

const getInvoiceInfo = {
  tags: ["Invoice"],
  description: "",
  summary: "get invoice information ",
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
            client_id: {
              type: "string",
              description: "Enter client id",
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

const getInvoice = {
  tags: ["Invoice"],
  description: "Get Invoice Data",
  summary: "get invoice  ",
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
      description: "ID of the Invoice",
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

const deleteInvoice = {
  tags: ["Invoice"],
  description: "",
  summary: "Delete invoice  ",
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
            invoiceIdsToDelete: {
              type: "array",
              description: "Enter FQA IDS to be delete",
              items: {
                type: "string",
              },
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

const getAllInvoice = {
  tags: ["Invoice"],
  description:
    "sort_order = (asc ,desc)  ,sort_field = (invoice_number ,due_date , status  ,total , invoice_date , customer_name)  , page  = (number) , items_per_page=(number) . search  = (string))  \n\n For Client Login \n\nagency_id  = (string) is required    ",
  summary: "Get All Invoice  ",
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
            sort_field: {
              type: "string",
              description: "Enter sortField",
              example: "invoice_date",
              required: true,
            },
            sort_order: {
              type: "string",
              description: "Enter sortOrder",
              example: "desc",
              required: true,
            },
            page: {
              type: "number",
              description: "Enter page number",
              example: 1,
              required: true,
            },
            items_per_page: {
              type: "number",
              description: "Enter itemsPerPage",
              example: 10,
              required: true,
            },
            agency_id: {
              type: "string",
              description: "Enter Agency Id",
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

const updateInvoice = {
  tags: ["Invoice"],
  description: "",
  summary: "Update Invoice ",
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
            client_id: {
              type: "string",
              description: "Enter client_id",
            },
            due_date: {
              type: "string",
              description: "Enter due_date",
              format: "date",
            },
            invoice_date: {
              type: "string",
              description: "Enter Invoice Date",
              format: "date",
            },
            invoice_content: {
              type: "array",
              description: "Enter invoice_content",
              items: {
                type: "object",
                properties: {
                  item: {
                    type: "string",
                    description: "Item name",
                  },
                  qty: {
                    type: "integer",
                    description: "Quantity",
                  },
                  rate: {
                    type: "integer",
                    description: "Rate per item",
                  },
                  tax: {
                    type: "integer",
                    description: "Tax percentage",
                  },
                  amount: {
                    type: "integer",
                    description: "Total amount for the item",
                  },
                  description: {
                    type: "string",
                    description: "Item description",
                  },
                },
              },
            },
            custom_client: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                address: { type: "string" },
                contact_number: { type: "string" },
              },
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
      description: "ID of the invoice",
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

const updateInvoiceStatus = {
  tags: ["Invoice"],
  description: "status : [ `unpaid` , `paid`,`overdue`]",
  summary: "Update Invoice Status ",

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
      description: "ID of the invoice",
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
const createInvoice = {
  tags: ["Invoice"],
  description: "",
  summary: "Create invoice",

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
            invoice_number: {
              type: "string",
              description: "Enter invoice_number",
              required: true,
            },
            client_id: {
              type: "string",
              description: "Enter recipient",
              required: true,
            },

            due_date: {
              type: "string",
              description: "Enter due_date",
              format: "date",
              required: true,
            },
            invoice_date: {
              type: "string",
              description: "Enter Invoice Date",
              format: "date",
              required: true,
            },
            invoice_content: {
              type: "array",
              description: "Enter invoice_content",
              items: {
                type: "object",
                properties: {
                  item: {
                    type: "string",
                    description: "Item name",
                    required: true,
                  },
                  description: {
                    type: "string",
                    description: "Item description",
                    required: true,
                  },
                  qty: {
                    type: "integer",
                    description: "Quantity",
                    required: true,
                  },
                  rate: {
                    type: "integer",
                    description: "Rate per item",
                    required: true,
                  },
                  tax: {
                    type: "integer",
                    description: "Tax percentage",
                    required: true,
                  },
                },
              },
            },
            custom_client: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                address: { type: "string" },
                contact_number: { type: "string" },
              },
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

const sendInvoice = {
  tags: ["Invoice"],
  description: "",
  summary: "Send Invoice",
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
            invoice_id: {
              type: "string",
              description: "Enter Invoice Id",
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

const downloadInvoice = {
  tags: ["Invoice"],
  description: "",
  summary: "Download Invoice",
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
            invoice_id: {
              type: "string",
              description: "Enter Invoice Id",
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
const uploadImage = {
  tags: ["Setting"],
  description: "",
  summary: "Upload logo",
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
            invoice_logo: {
              type: "string",
              format: "binary",
              description: "Please invoice logo",
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
const getSetting = {
  tags: ["Setting"],
  description: "",
  summary: "Upload logo",
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

const invoiceRoutes = {
  "/api/v1/invoice/get-clients": {
    get: getClients,
  },
  "/api/v1/invoice/get-invoice-data": {
    post: getInvoiceInfo,
  },
  "/api/v1/invoice/create-invoice": {
    post: createInvoice,
  },
  "/api/v1/invoice/get-all": {
    post: getAllInvoice,
  },
  "/api/v1/invoice/{id}": {
    get: getInvoice,
    put: updateInvoice,
  },

  "/api/v1/invoice/delete-invoice": {
    delete: deleteInvoice,
  },
  "/api/v1/invoice/status-update/{id}": {
    put: updateInvoiceStatus,
  },
  "/api/v1/invoice/send-invoice": {
    post: sendInvoice,
  },
  "/api/v1/invoice/download-invoice": {
    post: downloadInvoice,
  },
  "/api/v1/setting/upload-logo": {
    post: uploadImage,
  },
  "/api/v1/setting/get-setting": {
    get: getSetting,
  },
};

module.exports = invoiceRoutes;
