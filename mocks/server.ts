import { setupServer } from "msw/node";

// Started/reset/closed from vitest.setup.ts. No default handlers here: each test registers exactly the handler(s) it needs via `server.use(...)`, since the response shape (and, for useInventorySearch, the exact moment a response resolves) is the whole point of those tests.
export const server = setupServer();
