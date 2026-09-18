import { createApp } from "./app";
import { parsePort } from "./config";

const port = parsePort(process.env.PORT);
const app = createApp();

const server = app.listen(port, () => {
  const address = server.address();
  const listeningPort = address && typeof address !== "string" ? address.port : port;
  console.log(`Smart Expense Tracker API is running on http://localhost:${listeningPort}`);
  console.log(`API documentation is available at http://localhost:${listeningPort}/api-docs`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Set PORT to a free port and start again.`);
  } else {
    console.error(`The server could not start: ${error.message}`);
  }

  process.exit(1);
});
