import assert from "node:assert/strict";
import { once } from "node:events";
import { createRequire } from "node:module";

// Exercise the compiled application over a real loopback HTTP connection.
// A fresh app owns its own in-memory store; existing servers are untouched.
const require = createRequire(import.meta.url);
const { createApp } = require("../dist/app.js");
const server = createApp().listen(0, "127.0.0.1");

try {
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  async function request(path, expectedStatus, options) {
    const response = await fetch(baseUrl + path, {
      ...options,
      signal: AbortSignal.timeout(5000)
    });
    const label = `${options?.method ?? "GET"} ${path}`;
    const body = await response.text();
    assert.equal(
      response.status,
      expectedStatus,
      `${label}: expected HTTP ${expectedStatus}, got ${response.status}; body: ${body.slice(0, 500)}`
    );
    if (expectedStatus === 204) {
      assert.equal(body, "", `${label}: expected an empty response body`);
      return;
    }
    assert.match(
      response.headers.get("content-type") ?? "",
      /^application\/json(?:\s*;|$)/i,
      `${label}: expected an application/json response`
    );
    try {
      return JSON.parse(body);
    } catch (cause) {
      throw new Error(`${label}: response body is not valid JSON`, { cause });
    }
  }

  const expense = {
    id: "smoke-lunch",
    title: "Lunch",
    amount: 180.5,
    category: "Food",
    date: "2026-10-26"
  };
  const post = (body) => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  assert.deepEqual(await request("/expenses", 200), []);
  assert.deepEqual(await request("/expenses", 201, post(expense)), expense);
  assert.deepEqual(await request("/expenses?category=food", 200), [expense]);
  assert.deepEqual(await request("/expenses/summary", 200), {
    overall: 180.5,
    byCategory: { Food: 180.5 }
  });

  const duplicate = await request("/expenses", 409, post(expense));
  assert.equal(duplicate.error.code, "EXPENSE_ID_CONFLICT");
  const invalid = await request("/expenses", 400, post({ ...expense, amount: 0 }));
  assert.equal(invalid.error.code, "VALIDATION_ERROR");

  await request("/expenses/smoke-lunch", 204, { method: "DELETE" });
  const missing = await request("/expenses/smoke-lunch", 404, { method: "DELETE" });
  assert.equal(missing.error.code, "EXPENSE_NOT_FOUND");
  assert.deepEqual(await request("/expenses/summary", 200), {
    overall: 0,
    byCategory: {}
  });

  const contract = await request("/openapi.json", 200);
  assert.ok(contract.paths["/expenses"]);
  console.log("Smoke check passed: compiled API, CRUD, filtering, totals, errors and OpenAPI.");
} catch (error) {
  console.error("Smoke check failed:", error);
  process.exitCode = 1;
} finally {
  const closed = new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  server.closeAllConnections();
  await closed;
}
