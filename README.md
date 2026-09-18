# Smart Expense Tracker API

A REST API for recording, viewing, filtering, summarising and deleting personal expenses. The project focuses on correct API behaviour, clear validation, useful tests and a setup that works without a database or external service.

## Features

- Add an expense with a title, amount, category, date and an optional ID
- View all recorded expenses
- Filter expenses by category without case sensitivity
- Calculate the overall expense total and totals by category
- Delete an expense by its ID
- Return consistent validation and error responses
- Explore the API through OpenAPI documentation

## Quick Start

```bash
npm ci
npm run start
```

The API runs on `http://localhost:3000` and the Swagger page is at `http://localhost:3000/api-docs`.

To run the tests:

```bash
npm test
```

Each step is explained in more detail below.

## Technology Choices

- **Node.js and TypeScript** for a typed JavaScript backend
- **Express** for routing and HTTP handling
- **Zod** for validating request bodies, query parameters and IDs
- **Vitest and Supertest** for testing the API through HTTP requests
- **Swagger UI** for the single optional bonus: OpenAPI documentation

Expenses are stored in memory because the assignment allows it and does not require a database. Keeping storage separate from the HTTP routes also makes it possible to replace the in-memory repository with PostgreSQL later without changing the public API.

## Project Structure

```text
expense-ledger-api-/
├── README.md
├── AI_NOTES.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── .gitignore
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── openapi.ts
│   ├── expenses/
│   │   ├── expense.repository.ts
│   │   ├── expense.routes.ts
│   │   ├── expense.schema.ts
│   │   ├── expense.service.ts
│   │   └── expense.types.ts
│   └── middleware/
│       └── error-handler.ts
└── tests/
    └── expenses.api.test.ts
```

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer

## Installation

From the repository root, install the locked dependencies:

```bash
npm ci
```

## Building the Project

Compile TypeScript into the `dist/` directory. `npm run start` does this for you, so this is only needed to check the build on its own:

```bash
npm run build
```

## Running the Server

Start the API:

```bash
npm run start
```

This compiles the project first, so it works on a fresh checkout without a separate build step.

The server uses port `3000` by default. Set `PORT` to a whole number from `0` to `65535` to use a different one. `PORT=0` lets the operating system choose a free port; the startup message prints the selected port. Invalid or empty values are rejected. If the port is already taken, the server prints a short message saying so and exits instead of failing with a stack trace.

For development with automatic restarts:

```bash
npm run dev
```

## Running Tests

Run the complete test suite once:

```bash
npm test
```

The tests create a fresh application and in-memory store for each test, so they do not depend on execution order.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/expenses` | Add an expense |
| `GET` | `/expenses` | View all expenses |
| `GET` | `/expenses?category=Food` | Filter expenses by category |
| `GET` | `/expenses/summary` | Calculate overall and category totals |
| `DELETE` | `/expenses/:id` | Delete an expense |

### Add an expense

```http
POST /expenses
Content-Type: application/json
```

```json
{
  "title": "Lunch",
  "amount": 180.5,
  "category": "Food",
  "date": "2026-07-31"
}
```

Successful response: `201 Created`

```json
{
  "id": "dcfe5d87-f7a1-4c19-8651-d310f558b6f0",
  "title": "Lunch",
  "amount": 180.5,
  "category": "Food",
  "date": "2026-07-31"
}
```

The request may include an `id`. When it is omitted, the server generates a UUID. This supports both possible readings of the assignment while keeping generated IDs available by default:

```json
{
  "id": "expense-1",
  "title": "Lunch",
  "amount": 180.5,
  "category": "Food",
  "date": "2026-07-31"
}
```

Reusing an ID that already exists returns `409 Conflict` with the code `EXPENSE_ID_CONFLICT`.

### View or filter expenses

```http
GET /expenses
GET /expenses?category=food
```

Category filtering is case-insensitive. An unknown category returns an empty array. `category` is the only supported query parameter, so any other parameter is rejected with `400`.

### Calculate totals

```http
GET /expenses/summary
```

```json
{
  "overall": 750.5,
  "byCategory": {
    "Food": 350.5,
    "Travel": 400
  }
}
```

Categories are grouped the same way they are filtered, so `Food` and `food` count as one category. The first spelling recorded is the one used in the response.

An empty store returns:

```json
{
  "overall": 0,
  "byCategory": {}
}
```

### Delete an expense

```http
DELETE /expenses/dcfe5d87-f7a1-4c19-8651-d310f558b6f0
```

- `204 No Content` when the expense is deleted
- `404 Not Found` when no expense has that ID

URL-encode IDs containing special characters. Malformed URL encoding returns `400 Bad Request` with the code `INVALID_URL`.

## Validation Rules

- `id` is optional, trimmed, non-empty and at most 100 characters. A UUID is generated when it is left out.
- `title` is required, trimmed, non-empty and at most 100 characters.
- `amount` is required, at least `0.01` and limited to two decimal places. Amounts too large to hold exactly in paise are rejected.
- `category` is required, trimmed, non-empty and at most 50 characters.
- `date` is required and must be a real calendar date in `YYYY-MM-DD` format. `2026-02-30` is rejected.
- Fields outside the documented request body are rejected.
- `category` is the only query parameter accepted on `GET /expenses`.

A validation failure follows one response format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data.",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be at least 0.01."
      }
    ]
  }
}
```

Stack traces and internal error details are not returned to clients.

JSON request bodies larger than 100 KiB return `413 Payload Too Large` with the code `PAYLOAD_TOO_LARGE`.

Unsupported request charsets or content encodings return `415 Unsupported Media Type` with the code `UNSUPPORTED_MEDIA_TYPE`.

## OpenAPI Documentation

OpenAPI/Swagger is the only optional bonus included in this submission.

After starting the server:

- Swagger UI: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- OpenAPI JSON: [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json)

## Design Decisions

- Expense IDs may be supplied by the caller. When they are not, the server generates a UUID.
- Amounts are stored internally as integer paise, avoiding floating-point errors while calculating totals. Each amount is checked to make sure its paise figure is still a safe integer.
- Filtering and totals both treat categories without case sensitivity, while the original category text is kept in responses.
- Routes, business logic and storage are separated so each part remains easy to test and change.
- Tests call the public HTTP endpoints rather than testing private implementation details.

## Assumptions and Limitations

- Data resets whenever the server restarts because storage is in memory.
- Authentication, database persistence, update operations, pagination and a frontend are outside the assignment scope.
- Category names are kept as entered after trimming, so `Food` is displayed as `Food` even when the filter used `food`.
- Future dates are accepted because the assignment does not prohibit them.

## Author

**Thribhuvan P**  
GitHub: [thribhuvan003](https://github.com/thribhuvan003)  
Email: [thribhuvan003@gmail.com](mailto:thribhuvan003@gmail.com)
