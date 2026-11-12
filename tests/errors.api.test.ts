import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { ExpenseRepository } from "../src/expenses/expense.repository";

describe("Unexpected API failures", () => {
  it("returns generic JSON without exposing the internal failure", async () => {
    const failure = vi.spyOn(ExpenseRepository.prototype, "findAll")
      .mockImplementationOnce(() => {
        throw new Error("Internal storage failure detail");
      });

    try {
      const response = await request(createApp()).get("/expenses")
        .expect(500)
        .expect("Content-Type", /application\/json/);
      expect(response.body).toEqual({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred."
        }
      });
    } finally {
      failure.mockRestore();
    }
  });
});
