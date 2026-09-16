import request from "supertest";
import { Express } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const validExpense = {
  title: "Lunch",
  amount: 180.5,
  category: "Food",
  date: "2026-07-31"
};

describe("Expense API", () => {
  let app: Express;

  beforeEach(() => {
    app = createApp();
  });

  describe("POST /expenses", () => {
    it("creates an expense and returns 201", async () => {
      const response = await request(app).post("/expenses").send(validExpense);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(validExpense);
      expect(response.body.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("generates a different ID for each expense", async () => {
      const first = await request(app).post("/expenses").send(validExpense);
      const second = await request(app).post("/expenses").send({
        ...validExpense,
        title: "Dinner"
      });

      expect(first.body.id).not.toBe(second.body.id);
    });

    it("trims the title and category", async () => {
      const response = await request(app)
        .post("/expenses")
        .send({ ...validExpense, title: "  Lunch  ", category: "  Food  " });

      expect(response.body.title).toBe("Lunch");
      expect(response.body.category).toBe("Food");
    });

    it("uses the ID supplied by the caller", async () => {
      const response = await request(app)
        .post("/expenses")
        .send({ ...validExpense, id: "expense-1" });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe("expense-1");
    });

    it("rejects a second expense with the same ID", async () => {
      await request(app).post("/expenses").send({ ...validExpense, id: "expense-1" });

      const response = await request(app)
        .post("/expenses")
        .send({ ...validExpense, title: "Dinner", id: "expense-1" });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("EXPENSE_ID_CONFLICT");
    });

    it("returns only the documented fields", async () => {
      const response = await request(app).post("/expenses").send(validExpense);

      expect(Object.keys(response.body).sort()).toEqual([
        "amount",
        "category",
        "date",
        "id",
        "title"
      ]);
    });

    it.each([
      ["a missing title", { amount: 10, category: "Food", date: "2026-07-31" }, "title"],
      ["a blank title", { ...validExpense, title: "   " }, "title"],
      ["a missing category", { title: "Lunch", amount: 10, date: "2026-07-31" }, "category"],
      ["a blank category", { ...validExpense, category: "   " }, "category"],
      ["a zero amount", { ...validExpense, amount: 0 }, "amount"],
      ["a negative amount", { ...validExpense, amount: -10 }, "amount"],
      ["an amount that is not a number", { ...validExpense, amount: "10" }, "amount"],
      ["an amount smaller than one paisa", { ...validExpense, amount: 0.00000000001 }, "amount"],
      ["an amount that rounds down to nothing", { ...validExpense, amount: 0.004 }, "amount"],
      ["an amount too large to hold exactly", { ...validExpense, amount: 1e20 }, "amount"],
      ["a blank ID", { ...validExpense, id: "   " }, "id"],
      ["more than two decimal places", { ...validExpense, amount: 10.123 }, "amount"],
      ["an invalid calendar date", { ...validExpense, date: "2026-02-30" }, "date"],
      ["an invalid date format", { ...validExpense, date: "31-07-2026" }, "date"]
    ])("rejects %s", async (_caseName, body, field) => {
      const response = await request(app).post("/expenses").send(body);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details[0].field).toBe(field);
    });

    it("reports every missing field when the body is empty", async () => {
      const response = await request(app).post("/expenses").send({});

      expect(response.status).toBe(400);
      expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toEqual([
        "title",
        "amount",
        "category",
        "date"
      ]);
    });

    it("rejects fields outside the expense contract", async () => {
      const response = await request(app)
        .post("/expenses")
        .send({ ...validExpense, notes: "not part of the assignment" });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects oversized JSON without creating an expense", async () => {
      const response = await request(app)
        .post("/expenses")
        .send({ ...validExpense, title: "x".repeat(100 * 1024) });

      expect(response.status).toBe(413);
      expect(response.body).toEqual({
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "The request body is too large."
        }
      });

      const expenses = await request(app).get("/expenses");
      expect(expenses.status).toBe(200);
      expect(expenses.body).toEqual([]);
    });

    it("returns a clear error for invalid JSON", async () => {
      const response = await request(app)
        .post("/expenses")
        .set("Content-Type", "application/json")
        .send('{"title":');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: {
          code: "INVALID_JSON",
          message: "The request body contains invalid JSON."
        }
      });
    });
  });

  describe("GET /expenses", () => {
    it("returns an empty array when no expenses exist", async () => {
      const response = await request(app).get("/expenses");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("returns all created expenses", async () => {
      await request(app).post("/expenses").send(validExpense);
      await request(app).post("/expenses").send({
        ...validExpense,
        title: "Bus ticket",
        category: "Travel"
      });

      const response = await request(app).get("/expenses");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it("filters categories without case sensitivity", async () => {
      await request(app).post("/expenses").send(validExpense);
      await request(app).post("/expenses").send({
        ...validExpense,
        title: "Bus ticket",
        category: "Travel"
      });

      const response = await request(app).get("/expenses?category=food");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].category).toBe("Food");
    });

    it("returns an empty array for an unknown category", async () => {
      await request(app).post("/expenses").send(validExpense);

      const response = await request(app).get("/expenses?category=Health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("rejects an empty category filter", async () => {
      const response = await request(app).get("/expenses?category=");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects a query parameter the API does not support", async () => {
      const response = await request(app).get("/expenses?limit=5");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects the category filter when it is repeated", async () => {
      const response = await request(app).get("/expenses?category=Food&category=Travel");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /expenses/summary", () => {
    it("returns zero totals when no expenses exist", async () => {
      const response = await request(app).get("/expenses/summary");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ overall: 0, byCategory: {} });
    });

    it("calculates the overall total and totals by category", async () => {
      await request(app).post("/expenses").send({
        ...validExpense,
        amount: 120.25
      });
      await request(app).post("/expenses").send({
        ...validExpense,
        title: "Dinner",
        amount: 80.25
      });
      await request(app).post("/expenses").send({
        ...validExpense,
        title: "Bus ticket",
        amount: 40,
        category: "Travel"
      });

      const response = await request(app).get("/expenses/summary");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        overall: 240.5,
        byCategory: { Food: 200.5, Travel: 40 }
      });
    });

    it("groups categories that differ only by case", async () => {
      await request(app).post("/expenses").send({ ...validExpense, amount: 100 });
      await request(app).post("/expenses").send({
        ...validExpense,
        title: "Tea",
        amount: 25,
        category: "food"
      });

      const response = await request(app).get("/expenses/summary");

      expect(response.body).toEqual({
        overall: 125,
        byCategory: { Food: 125 }
      });
    });

    it("keeps a category named after an object property", async () => {
      await request(app).post("/expenses").send({
        ...validExpense,
        title: "Odd name",
        amount: 50,
        category: "__proto__"
      });

      const response = await request(app).get("/expenses/summary");

      // A computed key is needed here. Writing { __proto__: 50 } would set the
      // prototype of the literal instead of adding a key called "__proto__".
      expect(response.body).toEqual({
        overall: 50,
        byCategory: { ["__proto__"]: 50 }
      });
    });

    it("adds up to the same figure overall and by category", async () => {
      await request(app).post("/expenses").send({ ...validExpense, amount: 120.25 });
      await request(app).post("/expenses").send({
        ...validExpense,
        title: "Bus ticket",
        amount: 40,
        category: "Travel"
      });

      const response = await request(app).get("/expenses/summary");
      const categoryTotal = Object.values<number>(response.body.byCategory).reduce(
        (sum, total) => sum + total,
        0
      );

      expect(categoryTotal).toBe(response.body.overall);
    });

    it("handles decimal totals without floating-point output", async () => {
      await request(app).post("/expenses").send({ ...validExpense, amount: 10.1 });
      await request(app).post("/expenses").send({
        ...validExpense,
        title: "Tea",
        amount: 20.2
      });

      const response = await request(app).get("/expenses/summary");

      expect(response.body.overall).toBe(30.3);
      expect(response.body.byCategory.Food).toBe(30.3);
    });
  });

  describe("DELETE /expenses/:id", () => {
    it("deletes an existing expense and returns 204", async () => {
      const created = await request(app).post("/expenses").send(validExpense);

      const response = await request(app).delete(`/expenses/${created.body.id}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});

      const remaining = await request(app).get("/expenses");
      expect(remaining.body).toEqual([]);
    });

    it("returns 404 when the expense does not exist", async () => {
      const response = await request(app).delete(
        "/expenses/110ec58a-a0f2-4ac4-8393-c866d813b8d1"
      );

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("EXPENSE_NOT_FOUND");
    });

    it("returns 404 when the same expense is deleted twice", async () => {
      const created = await request(app).post("/expenses").send(validExpense);

      await request(app).delete(`/expenses/${created.body.id}`);
      const response = await request(app).delete(`/expenses/${created.body.id}`);

      expect(response.status).toBe(404);
    });

    it("deletes an expense created with a caller-supplied ID", async () => {
      await request(app).post("/expenses").send({ ...validExpense, id: "expense-1" });

      const response = await request(app).delete("/expenses/expense-1");

      expect(response.status).toBe(204);
    });

    it("returns 404 for an ID that was never used", async () => {
      const response = await request(app).delete("/expenses/not-a-uuid");

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("EXPENSE_NOT_FOUND");
    });
  });

  it("uses a new in-memory store for each app instance", async () => {
    await request(app).post("/expenses").send(validExpense);

    const anotherApp = createApp();
    const response = await request(anotherApp).get("/expenses");

    expect(response.body).toEqual([]);
  });

  it("serves the OpenAPI document", async () => {
    const response = await request(app).get("/openapi.json");

    expect(response.status).toBe(200);
    expect(response.body.info.title).toBe("Smart Expense Tracker API");
    expect(response.body.paths).toHaveProperty("/expenses");
    expect(response.body.paths).toHaveProperty("/expenses/summary");
    expect(response.body.paths).toHaveProperty("/expenses/{id}");
  });

  it("serves the Swagger UI page", async () => {
    const response = await request(app).get("/api-docs/");

    expect(response.status).toBe(200);
    expect(response.text).toContain("swagger-ui");
  });

  it("returns a consistent response for unknown routes", async () => {
    const response = await request(app).get("/unknown");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "The requested route was not found."
      }
    });
  });
});
