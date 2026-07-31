import { createApp } from "./app";

const port = Number(process.env.PORT) || 3000;
const app = createApp();

const server = app.listen(port, () => {
  console.log(`Smart Expense Tracker API is running on http://localhost:${port}`);
  console.log(`API documentation is available at http://localhost:${port}/api-docs`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Set PORT to a free port and start again.`);
  } else {
    console.error(`The server could not start: ${error.message}`);
  }

  process.exit(1);
});
