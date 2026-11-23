import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const expense = { title: "Calendar check", amount: 1, category: "Dates" };

describe("calendar dates through the HTTP API", () => {
  it.each(["0001-01-01", "0099-12-31", "2000-02-29", "2028-02-29", "9999-12-31"])(
    "preserves a valid date: %s",
    async (date) => {
      const app = createApp();
      const created = await request(app).post("/expenses").send({ ...expense, date });
      expect(created.status).toBe(201);
      expect(created.body.date).toBe(date);

      const listed = await request(app).get("/expenses");
      expect(listed.status).toBe(200);
      expect(listed.body).toEqual([created.body]);
    }
  );

  it.each([
    "0000-01-01",
    "1900-02-29",
    "2100-02-29",
    "2026-04-31",
    "2026-00-10",
    "2026-01-00",
    "2026-13-01",
    "2026-1-01",
    "2026-01-01T00:00:00Z",
    "2026-01-01\n"
  ])("rejects an invalid date without storing it: %j", async (date) => {
    const app = createApp();
    const rejected = await request(app).post("/expenses").send({ ...expense, date });
    expect(rejected.status).toBe(400);
    expect(rejected.body.error.code).toBe("VALIDATION_ERROR");
    expect(rejected.body.error.details).toContainEqual({
      field: "date",
      message: "Date must be a valid calendar date in YYYY-MM-DD format."
    });

    const listed = await request(app).get("/expenses");
    expect(listed.status).toBe(200);
    expect(listed.body).toEqual([]);
  });
});
