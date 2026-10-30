# Contributing

## Set up locally

Use Node.js 20 or newer and npm 10 or newer. CI checks Node.js 20, 22 and 24.

From the repository root:

```bash
npm ci
npm run dev
```

The development server restarts when source files change. Visit
[Swagger UI](http://localhost:3000/api-docs) to explore the API.
For startup and request errors, see [troubleshooting](docs/troubleshooting.md).

## Make an API change

Keep each change focused on one behavior. For a bug fix, include the request that
reproduces the problem and the expected response.

- Put HTTP routing and status handling in `src/expenses/expense.routes.ts`.
- Put input validation in `src/expenses/expense.schema.ts`.
- Keep business rules in the service and storage in the repository.
- Update `src/openapi.ts` and the README when the public API changes.
- Cover changed behavior through HTTP requests in `tests/expenses.api.test.ts`.
  Use a fresh application instance so tests do not depend on stored data or order.

For manual checks, [examples/expenses.http](examples/expenses.http) contains a
request sequence with expected statuses. Use disposable local data for that
sequence: it creates and deletes a fixed example ID.

## Check the change

```bash
npm run build
npm test
node scripts/smoke.mjs
```

The last command checks the compiled app, so run the build first. Alternatively,
`npm run smoke` builds automatically and then runs the same check.
The smoke check starts and closes its own application on a free loopback port;
it does not require the development server.

CI runs installation, build, tests and the smoke check on all three Node.js
versions. If one version fails, inspect its job log even if the others pass.
Newer runs of the same workflow event and branch or pull request cancel older
runs. Each matrix job has a ten-minute limit.

## Prepare the pull request

Describe the problem, the resulting behavior, and the checks you ran. Include an
example request and response for a public API change.

Follow `.editorconfig`: use two-space indentation, UTF-8 and LF line endings.
Intentional Markdown line breaks are preserved. Commit source and documentation;
leave `node_modules/` and generated `dist/` files out of the change.
