import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const run = promisify(execFile);
const serverPath = fileURLToPath(new URL("../src/server.ts", import.meta.url));

describe("Server startup", () => {
  it("reports an invalid PORT in one line and exits unsuccessfully", async () => {
    const result = await run(process.execPath, ["--import", "tsx", serverPath], {
      env: { ...process.env, PORT: "invalid" },
      encoding: "utf8",
      timeout: 10000
    }).then(
      ({ stdout, stderr }) => ({ code: 0, stdout, stderr }),
      (error: { code: unknown; stdout: string; stderr: string }) => ({
        code: error.code,
        stdout: error.stdout,
        stderr: error.stderr
      })
    );

    expect(result.code).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe(
      "The server could not start: PORT must be a whole number between 0 and 65535.\n"
    );
  }, 15000);
});
