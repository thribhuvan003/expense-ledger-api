import { describe, expect, it } from "vitest";
import { parsePort } from "../src/config";

describe("PORT configuration", () => {
  it("defaults to 3000 only when PORT is not set", () => {
    expect(parsePort(undefined)).toBe(3000);
  });

  it.each(["0", "3000", "65535", " 8080 "])("accepts %j", (value) => {
    expect(parsePort(value)).toBe(Number(value));
  });

  it.each(["", " ", "abc", "-1", "65536", "3.5", "1e3", "0x50", "Infinity"])(
    "rejects invalid PORT %j",
    (value) => {
      expect(() => parsePort(value)).toThrow("PORT must be a whole number between 0 and 65535.");
    }
  );
});
