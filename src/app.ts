import express, { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { ExpenseRepository } from "./expenses/expense.repository";
import { createExpenseRouter } from "./expenses/expense.routes";
import { ExpenseService } from "./expenses/expense.service";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { openApiDocument } from "./openapi";

export function createApp(): Express {
  const app = express();
  const repository = new ExpenseRepository();
  const service = new ExpenseService(repository);

  app.disable("x-powered-by");
  app.use(express.json());

  app.get("/openapi.json", (_request, response) => {
    response.status(200).json(openApiDocument);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use("/expenses", createExpenseRouter(service));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
