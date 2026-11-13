export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Smart Expense Tracker API",
    version: "1.0.0",
    description: "A REST API for recording, viewing, filtering, summarising and deleting expenses."
  },
  servers: [{ url: "/", description: "The origin serving this API document" }],
  tags: [{ name: "Expenses" }],
  paths: {
    "/expenses": {
      post: {
        tags: ["Expenses"],
        summary: "Add an expense",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateExpense" },
              examples: {
                generatedId: {
                  summary: "Let the server generate an ID",
                  value: {
                    title: "Lunch",
                    amount: 180.5,
                    category: "Food",
                    date: "2026-07-31"
                  }
                },
                suppliedId: {
                  summary: "Supply a unique ID",
                  value: {
                    id: "expense-1",
                    title: "Lunch",
                    amount: 180.5,
                    category: "Food",
                    date: "2026-07-31"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Expense created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Expense" }
              }
            }
          },
          "400": {
            description: "Invalid request data, malformed JSON or an unreadable body",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  invalidData: {
                    value: {
                      error: {
                        code: "VALIDATION_ERROR",
                        message: "The request contains invalid data.",
                        details: [{ field: "amount", message: "Amount must be at least 0.01." }]
                      }
                    }
                  },
                  invalidJson: {
                    value: {
                      error: {
                        code: "INVALID_JSON",
                        message: "The request body contains invalid JSON."
                      }
                    }
                  },
                  unreadableBody: {
                    value: {
                      error: {
                        code: "INVALID_BODY",
                        message: "The request body could not be read."
                      }
                    }
                  }
                }
              }
            }
          },
          "409": {
            description: "An expense with the supplied ID already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "EXPENSE_ID_CONFLICT",
                    message: "An expense with that ID already exists."
                  }
                }
              }
            }
          },
          "413": {
            description: "The JSON request body exceeds the 100 KiB limit",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "PAYLOAD_TOO_LARGE",
                    message: "The request body is too large."
                  }
                }
              }
            }
          },
          "415": {
            description: "The request body uses an unsupported charset or encoding",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "UNSUPPORTED_MEDIA_TYPE",
                    message: "The request body uses an unsupported charset or encoding."
                  }
                }
              }
            }
          }
        }
      },
      get: {
        tags: ["Expenses"],
        summary: "View expenses",
        parameters: [
          {
            in: "query",
            name: "category",
            required: false,
            schema: { type: "string", minLength: 1, maxLength: 50 },
            description: "Optional case-insensitive category filter"
          }
        ],
        responses: {
          "200": {
            description: "Expense list",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Expense" }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/ValidationError" }
        }
      }
    },
    "/expenses/summary": {
      get: {
        tags: ["Expenses"],
        summary: "Calculate expense totals",
        description:
          "Returns the overall total and a total per category. Categories are grouped without case sensitivity. Returns 409 if the aggregate exceeds the safe-integer paise range.",
        responses: {
          "200": {
            description: "Overall and category totals",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ExpenseSummary" }
              }
            }
          },
          "409": {
            description: "The aggregate exceeds the safe-integer paise range",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "EXPENSE_TOTAL_TOO_LARGE",
                    message: "The expense total is too large to calculate exactly."
                  }
                }
              }
            }
          }
        }
      }
    },
    "/expenses/{id}": {
      delete: {
        tags: ["Expenses"],
        summary: "Delete an expense",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", minLength: 1, maxLength: 100 }
          }
        ],
        responses: {
          "204": { description: "Expense deleted" },
          "400": { $ref: "#/components/responses/ValidationError" },
          "404": {
            description: "Expense not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "EXPENSE_NOT_FOUND",
                    message: "No expense was found with that ID."
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      CreateExpense: {
        type: "object",
        additionalProperties: false,
        required: ["title", "amount", "category", "date"],
        properties: {
          id: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            description: "Optional. A UUID is generated when this is left out.",
            example: "expense-1"
          },
          title: { type: "string", minLength: 1, maxLength: 100, example: "Lunch" },
          amount: {
            type: "number",
            format: "double",
            minimum: 0.01,
            multipleOf: 0.01,
            description: "At least 0.01, at most two decimal places; the amount in paise must be a safe integer",
            example: 180.5
          },
          category: { type: "string", minLength: 1, maxLength: 50, example: "Food" },
          date: { type: "string", format: "date", example: "2026-07-31" }
        }
      },
      Expense: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "amount", "category", "date"],
        properties: {
          id: { type: "string", minLength: 1, maxLength: 100 },
          title: { type: "string", minLength: 1, maxLength: 100, example: "Lunch" },
          amount: { type: "number", format: "double", minimum: 0.01, multipleOf: 0.01, example: 180.5 },
          category: { type: "string", minLength: 1, maxLength: 50, example: "Food" },
          date: { type: "string", format: "date", example: "2026-07-31" }
        }
      },
      ExpenseSummary: {
        type: "object",
        required: ["overall", "byCategory"],
        properties: {
          overall: { type: "number", example: 750.5 },
          byCategory: {
            type: "object",
            additionalProperties: { type: "number" },
            example: { Food: 350.5, Travel: 400 }
          }
        }
      },
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  required: ["field", "message"],
                  properties: {
                    field: { type: "string" },
                    message: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    responses: {
      ValidationError: {
        description: "Invalid request data",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
          }
        }
      }
    }
  }
};
