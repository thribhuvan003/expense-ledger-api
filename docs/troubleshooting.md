# Local troubleshooting

Run commands from the repository root. Inline environment-variable examples use
Bash or another POSIX shell. PowerShell alternatives are included below.

## The server cannot bind to port 3000

If startup reports `Port 3000 is already in use`, choose another port:

```bash
PORT=3001 npm start
```

In Windows PowerShell, set the variable before starting the server:

```powershell
$env:PORT = "3001"
npm start
```

Use `http://localhost:3001` for both API requests and `/api-docs`.
For the [HTTP request collection](../examples/expenses.http), update `baseUrl`.

You can also let the operating system select an available port:

```bash
PORT=0 npm start
```

PowerShell equivalent:

```powershell
$env:PORT = "0"
npm start
```

Read the selected port from the startup output. Do not send requests to port 0.

PowerShell keeps this setting in the current terminal session. After stopping the
server with Ctrl+C, remove it to restore the default port for future starts:

```powershell
Remove-Item Env:PORT -ErrorAction SilentlyContinue
```

Bash's inline `PORT=3001 npm start` applies only to that command.

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
| 400 / `VALIDATION_ERROR` | Read `error.details`. Send a positive amount with at most two decimal places and a real date in `YYYY-MM-DD` format. Only `category` is accepted on `GET /expenses`; `GET /expenses/summary` accepts no query parameters. |
| 400 / `INVALID_JSON` | Fix malformed JSON, such as a trailing comma or an unquoted property name. |
| 400 / `INVALID_BODY` | Send a complete request body. If using gzip or deflate, verify that the bytes are correctly compressed; an encoding header alone does not compress the data. |
| 400 / `INVALID_URL` | URL-encode IDs correctly; incomplete percent escapes are invalid. |
| 404 / `EXPENSE_NOT_FOUND` | Confirm the expense ID exists in the current server process. |
| 404 / `NOT_FOUND` | Check the route and HTTP method against the [endpoint table](../README.md#api-endpoints). |
| 409 / `EXPENSE_ID_CONFLICT` | Omit `id` to generate a UUID, or choose an ID that is not already stored. |
| 409 / `EXPENSE_TOTAL_TOO_LARGE` | The combined total exceeds the safe-integer range in paise. List the stored expenses and delete an expense if appropriate to bring the total back into range. |
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
npm run check
```

This builds the app, runs the tests and checks the compiled API in sequence.

Include the Node.js version, the command or request that failed, the HTTP status
and the response's `error.code`. Remove personal expense data before sharing logs.
