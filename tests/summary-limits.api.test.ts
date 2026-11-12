import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const expense = { title: "Large expense", category: "Food", date: "2026-11-12" };

describe("Summary numeric limits", () => {
  it.each(["Food", "Travel"])(
    "rejects unsafe totals and recovers after deletion with category %s",
    async (category) => {
      const app = createApp();
      await request(app).post("/expenses").send({
        ...expense, id: "large-a", amount: 50000000000000
      }).expect(201);
      await request(app).post("/expenses").send({
        ...expense, id: "large-b", amount: 50000000000000.01, category
      }).expect(201);

      const summary = await request(app).get("/expenses/summary").expect(409);
      expect(summary.body).toEqual({
        error: {
          code: "EXPENSE_TOTAL_TOO_LARGE",
          message: "The expense total is too large to calculate exactly."
        }
      });
      const stored = await request(app).get("/expenses").expect(200);
      expect(stored.body).toHaveLength(2);

      await request(app).delete("/expenses/large-b").expect(204);
      const recovered = await request(app).get("/expenses/summary").expect(200);
      expect(recovered.body).toEqual({
        overall: 50000000000000,
        byCategory: { Food: 50000000000000 }
      });
    }
  );

  it("accepts the safe-integer boundary but rejects one more paisa", async () => {
    const app = createApp();
    const amount = 90071992547409.9;
    await request(app).post("/expenses").send({
      ...expense, id: "boundary", amount
    }).expect(201);
    const summary = await request(app).get("/expenses/summary").expect(200);
    expect(summary.body).toEqual({ overall: amount, byCategory: { Food: amount } });

    await request(app).post("/expenses").send({
      ...expense, id: "one-paisa", amount: 0.01
    }).expect(201);
    await request(app).get("/expenses/summary").expect(409);
  });
});
