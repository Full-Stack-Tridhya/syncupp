const logIn = {
  tags: ["Affiliate - Auth"],
  description: "",
  summary: "Login affiliate",

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
              description: "Enter Email",
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

const signUp = {
  tags: ["Affiliate - Auth"],
  description: "",
  summary: "Sign Up affiliate",

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
              description: "Enter Email",
              required: true,
            },
            password: {
              type: "string",
              description: "Enter password",
              required: true,
            },
            company_name: {
              type: "string",
              description: "Enter company_name",
              required: true,
            },
            first_name: {
              type: "string",
              description: "Enter name",
              required: true,
            },
            last_name: {
              type: "string",
              description: "Enter name",
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

const forgotPassword = {
  tags: ["Affiliate - Auth"],
  description: "",
  summary: "Forgot password affiliate",

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
              description: "Enter Email",
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

const resetPassword = {
  tags: ["Affiliate - Auth"],
  description: "",
  summary: "Reset password affiliate",

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
              description: "Enter Email",
              required: true,
            },
            token: {
              type: "string",
              description: "Enter Token",
              required: true,
            },
            new_password: {
              type: "string",
              description: "Enter New Password",
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

const changePassword = {
  tags: ["Affiliate - Auth"],
  description: "",
  summary: "Change password affiliate",

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
            old_password: {
              type: "string",
              description: "Enter old password",
              required: true,
            },

            new_password: {
              type: "string",
              description: "Enter New Password",
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

const getProfile = {
  tags: ["Affiliate - Auth"],
  description: "",
  summary: "Change password affiliate",

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

const updateProfile = {
  tags: ["Affiliate - Auth"],
  description: "",
  summary: "Update Profile affiliate",

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
              description: "Enter First_name",
              required: true,
            },
            last_name: {
              type: "string",
              description: "Enter Last_name",
              required: true,
            },
            company_name: {
              type: "string",
              description: "Enter Company name",
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

const affiliateRoutes = {
  "/api/v1/affiliate/signup": {
    post: signUp,
  },
  "/api/v1/affiliate/login": {
    post: logIn,
  },
  "/api/v1/affiliate/forgot-password": {
    post: forgotPassword,
  },
  "/api/v1/affiliate/reset-password": {
    post: resetPassword,
  },
  "/api/v1/affiliate/change-password": {
    post: changePassword,
  },
  "/api/v1/affiliate/get-profile": {
    get: getProfile,
  },
  "/api/v1/affiliate/update-profile": {
    put: updateProfile,
  },
};

module.exports = affiliateRoutes;
