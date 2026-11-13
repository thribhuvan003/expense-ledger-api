import request from "supertest";
import { deflateSync, gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const expense = { title: "Lunch", amount: 10, category: "Food", date: "2026-11-13" };

describe("Compressed request bodies", () => {
  it.each(["gzip", "deflate"])("rejects corrupt %s data as a client error", async (encoding) => {
    const app = createApp();
    const response = await request(app).post("/expenses")
      .set("Content-Type", "application/json")
      .set("Content-Encoding", encoding)
      .send("not compressed")
      .expect(400)
      .expect("Cache-Control", "no-store");

    expect(response.body).toEqual({
      error: { code: "INVALID_BODY", message: "The request body could not be read." }
    });
    const stored = await request(app).get("/expenses").expect(200);
    expect(stored.body).toEqual([]);
  });

  it("rejects truncated gzip data without creating an expense", async () => {
    const app = createApp();
    const response = await request(app).post("/expenses")
      .set("Content-Type", "application/json")
      .set("Content-Encoding", "gzip")
      .serialize((value) => value)
      .send(Buffer.from([0x1f, 0x8b, 0x08]))
      .expect(400);
    expect(response.body.error.code).toBe("INVALID_BODY");
    const stored = await request(app).get("/expenses").expect(200);
    expect(stored.body).toEqual([]);
  });

  it.each([["gzip", gzipSync], ["deflate", deflateSync]] as const)(
    "still accepts valid %s JSON",
    async (encoding, compress) => {
      const response = await request(createApp()).post("/expenses")
        .set("Content-Type", "application/json")
        .set("Content-Encoding", encoding)
        .serialize((value) => value)
        .send(compress(Buffer.from(JSON.stringify(expense))))
        .expect(201);
      expect(response.body).toMatchObject(expense);
    }
  );
});
