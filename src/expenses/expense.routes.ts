import { Router } from "express";
import { ExpenseService } from "./expense.service";
import {
  createExpenseSchema,
  expenseIdSchema,
  expenseQuerySchema
} from "./expense.schema";

export function createExpenseRouter(service: ExpenseService): Router {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const input = createExpenseSchema.parse(request.body);
      const expense = service.create(input);

      if (!expense) {
        response.status(409).json({
          error: {
            code: "EXPENSE_ID_CONFLICT",
            message: "An expense with that ID already exists."
          }
        });
        return;
      }

      response.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  });

  router.get("/", (request, response, next) => {
    try {
      const query = expenseQuerySchema.parse(request.query);
      response.status(200).json(service.list(query.category));
    } catch (error) {
      next(error);
    }
  });

  router.get("/summary", (_request, response) => {
    response.status(200).json(service.getSummary());
  });

  router.delete("/:id", (request, response, next) => {
    try {
      const id = expenseIdSchema.parse(request.params.id);
      const wasDeleted = service.delete(id);

      if (!wasDeleted) {
        response.status(404).json({
          error: {
            code: "EXPENSE_NOT_FOUND",
            message: "No expense was found with that ID."
          }
        });
        return;
      }

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
