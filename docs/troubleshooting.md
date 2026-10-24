# Local troubleshooting

Run commands from the repository root. The examples below use a POSIX shell
such as Bash; on Windows, use Git Bash or WSL for the inline environment variables.

## The server cannot bind to port 3000

If startup reports `Port 3000 is already in use`, choose another port:

```bash
PORT=3001 npm start
```

Use `http://localhost:3001` for both API requests and `/api-docs`.
For the [HTTP request collection](../examples/expenses.http), update `baseUrl`.

You can also let the operating system select an available port:

```bash
PORT=0 npm start
```

Read the selected port from the startup output. Do not send requests to port 0.

## PORT is rejected before startup

Omit `PORT` to use 3000, or set a whole number from 0 through 65535.
An empty value, negative value, fractional number or text is invalid.

## A new checkout cannot find dependencies or compiled files

Use Node.js 20 or newer, then run:

```bash
npm ci
npm start
```

`npm start` runs the TypeScript build before launching the server.
After removing `node_modules`, install dependencies again with `npm ci`.
For an isolated compile check, use `npm run build`.

## Requests return an error

Read `error.code` in the JSON response:

| Status / code | What to check |
| --- | --- |
| 400 / `VALIDATION_ERROR` | Read `error.details`. Send a positive amount with at most two decimal places and a real date in `YYYY-MM-DD` format. Only `category` is accepted as a list query parameter. |
| 400 / `INVALID_JSON` | Fix malformed JSON, such as a trailing comma or an unquoted property name. |
| 400 / `INVALID_URL` | URL-encode IDs correctly; incomplete percent escapes are invalid. |
| 404 / `EXPENSE_NOT_FOUND` | Confirm the expense ID exists in the current server process. |
| 404 / `NOT_FOUND` | Check the route and HTTP method against the [endpoint table](../README.md#api-endpoints). |
| 409 / `EXPENSE_ID_CONFLICT` | Omit `id` to generate a UUID, or choose an ID that is not already stored. |
| 413 / `PAYLOAD_TOO_LARGE` | Keep the JSON request body within the 100 KiB limit. |
| 415 / `UNSUPPORTED_MEDIA_TYPE` | Remove unsupported charset or content-encoding headers; use ordinary UTF-8 JSON. |

For POST requests, set `Content-Type: application/json`.
Use [examples/expenses.http](../examples/expenses.http) for a complete sequence
with expected success and error statuses. Run it against disposable local data.

## Expenses disappeared after restarting

Storage is in memory and belongs to one application instance. Restarting the
server clears it. Separate server processes do not share expenses.
For repeatable manual checks, recreate the example expense after restarting.

## Check the project before reporting a problem

```bash
npm run build
npm test
```

Include the Node.js version, the command or request that failed, the HTTP status
and the response's `error.code`. Remove personal expense data before sharing logs.
