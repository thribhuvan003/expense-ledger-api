import request from "supertest";
import { describe, it } from "vitest";
import { createApp } from "../src/app";

describe("Expense response caching", () => {
  it.each(["/expenses", "/expenses/summary"])(
    "prevents storage of %s responses",
    async (path) => {
      await request(createApp()).get(path)
        .expect(200)
        .expect("Cache-Control", "no-store");
    }
  );

  it("also prevents caching of malformed JSON errors", async () => {
    await request(createApp()).post("/expenses")
      .set("Content-Type", "application/json")
      .send("{")
      .expect(400)
      .expect("Cache-Control", "no-store");
  });
});
