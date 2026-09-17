import { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

type ParserError = Error & {
  status?: number;
  type?: string;
};

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested route was not found."
    }
  });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof URIError && "status" in error && error.status === 400) {
    response.status(400).json({
      error: {
        code: "INVALID_URL",
        message: "The request URL contains invalid encoding."
      }
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "The request contains invalid data.",
        details: error.issues.map((issue) => ({
          field: issue.path.join(".") || "request",
          message: issue.message
        }))
      }
    });
    return;
  }

  const parserError = error as ParserError;
  if (parserError.type === "entity.too.large" && parserError.status === 413) {
    response.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "The request body is too large."
      }
    });
    return;
  }

  if (parserError.type === "entity.parse.failed" && parserError.status === 400) {
    response.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "The request body contains invalid JSON."
      }
    });
    return;
  }

  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred."
    }
  });
};
