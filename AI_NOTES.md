# AI Notes

## Tools I Used

I used ChatGPT and Grok to understand the requirements, compare possible approaches and plan the API structure.

I used Codex to generate the first working version of the project, and later used Claude to review the code and documentation.

## What I Decided Before Starting

- Use Node.js with TypeScript and Express
- Keep the data in memory, as allowed by the assignment
- Use OpenAPI/Swagger as the only optional bonus
- Keep the structure simple: routes → service → repository
- Focus only on the features requested in the brief

## What AI Generated

The first version included:

- project setup
- routes and validation
- service and in-memory repository
- initial tests
- OpenAPI setup
- drafts of the README and this file

I used it as a starting point and reviewed the code before preparing the final version.

## What I Changed

After going through the code and testing the API, I made these changes:

- Moved the amount conversion into the service instead of keeping a separate helper file. It was only a few lines, so the extra file did not feel necessary.
- Made the category summary follow the same case-insensitive logic as the category filter. Earlier, the filter matched `Food` and `food`, but the summary placed them in separate groups.
- Improved validation tests so they check which field failed, not only that an error was returned.
- Added support for an optional ID from the client. If no ID is sent, the server generates one. If the same ID is used again, the API returns `409 Conflict`.
- Updated the delete endpoint so it works with both generated and client-provided IDs.
- Added checks to prevent amounts smaller than one paisa from being stored as zero.
- Fixed the category totals so a category name that matches a built-in object property is not dropped from the summary.
- Replaced the earlier fixed maximum amount with validation that checks whether the value can be represented safely in paise.
- Handled the case where the selected port is already in use, so the server prints a clear message instead of a long stack trace.
- Updated the README and OpenAPI documentation so the commands, examples and responses match the final code.

The issues with very small amounts and unusual category names were identified during the Claude review rather than my initial testing. I reproduced both issues, understood why they happened and chose the final fixes myself.

## AI Suggestions I Did Not Use

- A maximum amount of 1000000000. The reason given was that it kept totals within a safe range, but a limit on one expense says nothing about the total of many. I replaced it with a check on whether the amount can be stored safely in paise.
- Upgrading to Express 5, Zod 4 and TypeScript 7 to clear `npm audit`. That meant rewriting working code close to the deadline, so I moved to the latest version within each current major instead. This cleared the reported dependency vulnerabilities without requiring application-code changes.
- A controller layer between the routes and the service. For four endpoints it would only be another file passing calls through.
- Adding Docker as well. The brief says to pick at most one bonus, and I had already chosen OpenAPI.

## What I Left Out

I did not add authentication, persistence, search, monthly summaries, pagination, update endpoints or a frontend because they were outside the requested scope.

OpenAPI/Swagger was the single optional bonus, so I did not also add Docker.

## Verification

I tested the project from a clean checkout using:

```bash
npm ci
npm run build
npm test
npm run start
```

Results on Node v22.18.0 and npm 10.9.3:

- `npm ci` installed cleanly with no vulnerabilities reported
- `npm run build` compiled with no TypeScript errors
- `npm test` ran 45 tests and all passed
- `npm run start` served the API on http://localhost:3000

I then checked each endpoint by hand with the server running, including the invalid cases: bad dates, negative and non-numeric amounts, unknown fields, malformed JSON, an unknown category, deleting the same ID twice, and the Swagger page.

## Final Responsibility

AI helped with planning, the initial implementation and review. I reviewed the final code, reproduced the issues raised during review, chose the fixes and verified the submitted behaviour. I understand the implementation and can explain the decisions made in it.
