export function parsePort(value: string | undefined): number {
  if (value === undefined) return 3000;

  const normalized = value.trim();
  const port = Number(normalized);
  if (!/^\d+$/.test(normalized) || !Number.isInteger(port) || port > 65535) {
    throw new Error("PORT must be a whole number between 0 and 65535.");
  }

  return port;
}
