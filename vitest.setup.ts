import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./mocks/server";

afterEach(() => {
  cleanup();
});

// jsdom has no ResizeObserver. @tanstack/react-virtual guards its absence (falls back to a no-op), but components/ui/edge-scroller.tsx calls `new ResizeObserver(...)` unconditionally; any component test that mounts real UI chrome using it (e.g. ControlPanelTogglers) needs this stub, so it's global rather than per-test-file.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
