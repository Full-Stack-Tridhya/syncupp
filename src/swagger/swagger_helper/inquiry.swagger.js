const deleteInquiry = {
  tags: ["Inquiry"],
  description: "",
  summary: "Delete inquiry  ",
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
            inquiryIdsToDelete: {
              type: "array",
              description: "Enter Inquiry IDS to be delete",
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

const getAllInquiry = {
  tags: ["Inquiry"],
  description:
    "sort_order = (asc ,desc)  ,sort_field = (name , email,message,contact_number, createdAt)  , page  = (number) , items_per_page=(number) . search  = (string))",
  summary: "Get All inquiry  ",
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
              example: "createdAt",
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

const createInquiry = {
  tags: ["Inquiry"],
  description: "",
  summary: "Send inquiry",

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
              description: "Enter first_name",
              required: true,
            },
            last_name: {
              type: "string",
              description: "Enter last_name",
              required: true,
            },
            contact_number: {
              type: "string",
              description: "Enter contact number",
              required: true,
            },
            email: {
              type: "string",
              description: "Enter email",
            },
            no_of_people: {
              type: "string",
              description: "Enter no of People",
            },
            country: {
              type: "string",
              description: "Enter country",
            },
            thoughts: {
              type: "string",
              description: "Enter thoughts",
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

const inquiryRoutes = {
  "/api/v1/inquiry/send-inquiry": {
    post: createInquiry,
  },
  "/api/v1/inquiry/get-all": {
    post: getAllInquiry,
  },
  "/api/v1/inquiry": {
    delete: deleteInquiry,
  },
};

module.exports = inquiryRoutes;
