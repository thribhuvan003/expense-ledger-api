import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("Summary query validation", () => {
  it.each(["category=Travel", "limit=1", "__proto__=ignored"])(
    "rejects unsupported query data: %s",
    async (query) => {
      const app = createApp();
      await request(app).post("/expenses").send({
        title: "Lunch", amount: 10, category: "Food", date: "2026-11-13"
      }).expect(201);

      const response = await request(app).get(`/expenses/summary?${query}`).expect(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      const summary = await request(app).get("/expenses/summary").expect(200);
      expect(summary.body).toEqual({ overall: 10, byCategory: { Food: 10 } });
    }
  );
});
