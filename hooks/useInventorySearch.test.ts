import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import {
  useInventorySearch,
  DEBOUNCE_MS,
} from "@/hooks/useInventorySearch";
import { useInventorySearchStore } from "@/store/inventory-search";
import { useSimControlStore } from "@/store/simulator-control";

interface PendingRequest {
  query: string;
  signal: AbortSignal;
  resolve: (ids: number[]) => void;
}

let pending: PendingRequest[] = [];

// Each GET returns a Promise that never settles on its own; the test resolves the right one, in whatever order it chooses, via resolveQuery below. This is how "who responds first" gets a deterministic answer instead of depending on real or faked milliseconds matching the server's own artificial-delay formula.
function registerSearchHandler() {
  pending = [];
  server.use(
    http.get("/api/inventory-search", ({ request }) => {
      const query = new URL(request.url).searchParams.get("q") ?? "";
      return new Promise<Response>((resolve) => {
        pending.push({
          query,
          signal: request.signal,
          resolve: (ids) => resolve(HttpResponse.json({ ids })),
        });
      });
    }),
  );
}

function resolveQuery(query: string, ids: number[]) {
  const index = pending.findIndex((p) => p.query === query);
  if (index === -1) {
    throw new Error(`no pending request for query "${query}"`);
  }
  const [entry] = pending.splice(index, 1);
  entry.resolve(ids);
}

beforeEach(() => {
  useInventorySearchStore.setState({
    query: "",
    matchedIds: null,
    isSearching: false,
    isStale: false,
  });
  useSimControlStore.getState().resetToggles();
  useSimControlStore.getState().clearAlerts();
  registerSearchHandler();
});

// hooks/useInventorySearch.ts, Case 4 (docs/case4.md). Toggle ON (bad path): every keystroke fires its own request immediately, with no cancellation, so a slower response for an earlier (shorter) query can resolve after a faster response for a later (longer) one, and setMatchedIds is called unconditionally, so the stale response really does overwrite the display, not just flip a flag. Toggle OFF (good path): a debounce (DEBOUNCE_MS) collapses rapid typing into one request, and an AbortController cancels any still-in-flight previous request before the next one starts.
describe("useInventorySearch — bad path (race condition toggle on)", () => {
  beforeEach(() => {
    useSimControlStore.getState().setToggle("raceCondition", true);
  });

  it("a stale response (for the earlier, shorter query) overwrites the already-correct matchedIds and raises the raceCondition alert — reproduces docs/case4.md's 'l'/'li'/'lipstick' example", async () => {
    renderHook(() => useInventorySearch());

    act(() => useInventorySearchStore.getState().setQuery("l"));
    act(() => useInventorySearchStore.getState().setQuery("li"));
    act(() => useInventorySearchStore.getState().setQuery("lipstick"));

    // msw's interceptor reaches the handler (and pushes into `pending`) asynchronously; wait for all three in-flight requests to actually register before resolving any of them.
    await waitFor(() => expect(pending).toHaveLength(3));

    // "lipstick" (the current, correct query) resolves first, display is briefly correct.
    resolveQuery("lipstick", [10, 20]);
    await waitFor(() => {
      expect(useInventorySearchStore.getState().matchedIds).toEqual(
        new Set([10, 20]),
      );
    });

    // "l" (the stale, earlier query) resolves last and overwrites it.
    resolveQuery("l", [99]);
    await waitFor(() => {
      expect(useInventorySearchStore.getState().matchedIds).toEqual(
        new Set([99]),
      );
    });

    expect(useInventorySearchStore.getState().isStale).toBe(true);
    expect(useSimControlStore.getState().caseAlerts.raceCondition).toBe(
      "shown",
    );
  });

  it("the alert clears once the response for a fresh, truly-current query arrives", async () => {
    renderHook(() => useInventorySearch());

    act(() => useInventorySearchStore.getState().setQuery("l"));
    act(() => useInventorySearchStore.getState().setQuery("li"));
    act(() => useInventorySearchStore.getState().setQuery("lipstick"));

    await waitFor(() => expect(pending).toHaveLength(3));

    resolveQuery("lipstick", [10, 20]);
    await waitFor(() =>
      expect(useInventorySearchStore.getState().matchedIds).toEqual(
        new Set([10, 20]),
      ),
    );
    resolveQuery("l", [99]);
    await waitFor(() =>
      expect(useSimControlStore.getState().caseAlerts.raceCondition).toBe(
        "shown",
      ),
    );

    // A fresh keystroke fires a brand new request; resolving *that* one is what actually clears the alert (the still-pending "li" request never gets resolved at all, same as in the real app: a superseded request whose response never mattered).
    act(() => useInventorySearchStore.getState().setQuery("lipsticks"));
    await waitFor(() =>
      expect(pending.some((p) => p.query === "lipsticks")).toBe(true),
    );
    resolveQuery("lipsticks", [7]);

    await waitFor(() => {
      expect(useInventorySearchStore.getState().isStale).toBe(false);
    });
    expect(
      useSimControlStore.getState().caseAlerts.raceCondition,
    ).toBeUndefined();
    expect(useInventorySearchStore.getState().matchedIds).toEqual(
      new Set([7]),
    );
  });
});

describe("useInventorySearch — good path (race condition toggle off)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces rapid typing into a single request for the final query only", async () => {
    renderHook(() => useInventorySearch());

    act(() => useInventorySearchStore.getState().setQuery("l"));
    act(() => useInventorySearchStore.getState().setQuery("li"));
    act(() => useInventorySearchStore.getState().setQuery("lipstick"));

    // No DEBOUNCE_MS of silence has passed yet for any of the three keystrokes, nothing should have fired.
    expect(pending).toHaveLength(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    });

    expect(pending).toHaveLength(1);
    expect(pending[0].query).toBe("lipstick");
  });

  it("aborts the earlier in-flight request before the next debounced request starts, and applies only the later response", async () => {
    renderHook(() => useInventorySearch());

    act(() => useInventorySearchStore.getState().setQuery("l"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    });
    expect(pending).toHaveLength(1);
    const firstRequest = pending[0];
    expect(firstRequest.signal.aborted).toBe(false);

    act(() => useInventorySearchStore.getState().setQuery("lipstick"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    });

    expect(firstRequest.signal.aborted).toBe(true);

    // Switch back to real timers before waiting on the network response; @testing-library/react's waitFor polls with a real setTimeout, which never fires while fake timers are still active.
    vi.useRealTimers();
    resolveQuery("lipstick", [10, 20]);
    await waitFor(() => {
      expect(useInventorySearchStore.getState().matchedIds).toEqual(
        new Set([10, 20]),
      );
    });
  });
});

describe("useInventorySearch — shared behavior regardless of toggle", () => {
  it("clearing the query resets matchedIds/isSearching/isStale and closes the raceCondition alert, firing no request", () => {
    useInventorySearchStore.setState({
      query: "lipstick",
      matchedIds: new Set([1]),
      isSearching: true,
      isStale: true,
    });
    useSimControlStore.getState().triggerAlert("raceCondition");
    renderHook(() => useInventorySearch());

    act(() => useInventorySearchStore.getState().setQuery(""));

    expect(useInventorySearchStore.getState().matchedIds).toBeNull();
    expect(useInventorySearchStore.getState().isSearching).toBe(false);
    expect(useInventorySearchStore.getState().isStale).toBe(false);
    expect(
      useSimControlStore.getState().caseAlerts.raceCondition,
    ).toBeUndefined();
    expect(pending).toHaveLength(0);
  });
});
