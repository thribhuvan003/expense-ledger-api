# Try the API with curl

These commands use Bash (including Git Bash or WSL on Windows) and curl.
For an editor-based request client, use [examples/expenses.http](../examples/expenses.http).

Start a disposable local server from the repository root:

```bash
npm ci
npm start
```

Leave that terminal running. In a second terminal, set the URL:

```bash
base_url=http://localhost:3000
```

Use the port printed by the server if it differs from 3000. The requests below
create and delete only the example ID `curl-demo-lunch`. If that ID already
belongs to an expense you need, change it in every request first.
The listed totals and final empty list assume a fresh server.

## Create an expense

Expected: `201 Created` and the expense object.

```bash
curl --fail --silent --show-error --include \
  -X POST "$base_url/expenses" \
  -H 'Content-Type: application/json' \
  --data '{"id":"curl-demo-lunch","title":"Lunch","amount":180.5,"category":"Food","date":"2026-11-02"}'
```

Running this POST twice before deleting the expense returns `409 Conflict`
because the ID is already stored.

## Inspect a duplicate-ID error

Before deleting the example expense, send the same ID again.
Expected: `409 Conflict`, code `EXPENSE_ID_CONFLICT`, and message
`An expense with that ID already exists.`

```bash
curl --silent --show-error --include \
  -X POST "$base_url/expenses" \
  -H 'Content-Type: application/json' \
  --data '{"id":"curl-demo-lunch","title":"Lunch","amount":180.5,"category":"Food","date":"2026-11-02"}'
```

The error leaves the original expense unchanged, so the later totals still apply.
This command omits `--fail` so curl prints the JSON error body; inspect the HTTP
status shown in the headers.

## Filter by category

Expected: `200 OK` with an array containing the lunch expense.
Filtering accepts a different letter case.

```bash
curl --fail --silent --show-error --include "$base_url/expenses?category=food"
```

## Read the totals

Expected: `200 OK` with `{"overall":180.5,"byCategory":{"Food":180.5}}`.

```bash
curl --fail --silent --show-error --include "$base_url/expenses/summary"
```

## Inspect an unsupported summary filter

Summary totals are always for the complete store. Filtering the expense list
does not filter the summary endpoint.

Expected: `400 Bad Request`, code `VALIDATION_ERROR`. No expense is changed.

```bash
curl --silent --show-error --include "$base_url/expenses/summary?category=food"
```

This is an intentional error check. The normal summary request above takes no
query parameters.

## Delete the example

Expected: `204 No Content` with no response body.

```bash
curl --fail --silent --show-error --include \
  -X DELETE "$base_url/expenses/curl-demo-lunch"
```

## Confirm the store is empty

Expected: `200 OK` with `[]`.

```bash
curl --fail --silent --show-error --include "$base_url/expenses"
```

`--include` prints the response headers so you can inspect the HTTP status.
`--fail` makes curl exit unsuccessfully for HTTP errors such as 400 or 409.
For request error codes or startup problems, see [troubleshooting](troubleshooting.md).
Restarting the server clears all in-memory expenses.
