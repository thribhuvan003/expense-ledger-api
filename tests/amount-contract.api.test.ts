import request from "supertest";
import { expect, it } from "vitest";
import { createApp } from "../src/app";

it("publishes an amount maximum that agrees with creation and list responses", async () => {
  const app = createApp();
  const document = await request(app).get("/openapi.json");
  expect(document.status).toBe(200);
  const schemas = document.body.components.schemas;
  const maximum = schemas.CreateExpense.properties.amount.maximum;
  expect(maximum).toBe(90071992547409.9);
  expect(schemas.Expense.properties.amount.maximum).toBe(maximum);

  const input = {
    title: "Boundary amount",
    amount: maximum,
    category: "Limits",
    date: "2026-11-23"
  };
  const created = await request(app).post("/expenses").send(input);
  expect(created.status).toBe(201);
  expect(created.body.amount).toBe(maximum);

  const rejected = await request(app)
    .post("/expenses")
    .send({ ...input, amount: maximum + 0.02 });
  expect(rejected.status).toBe(400);
  expect(rejected.body.error.code).toBe("VALIDATION_ERROR");
  expect(rejected.body.error.details).toContainEqual({
    field: "amount",
    message: "Amount is too large to record exactly."
  });

  const expenses = await request(app).get("/expenses");
  expect(expenses.status).toBe(200);
  expect(expenses.body).toEqual([created.body]);
});
