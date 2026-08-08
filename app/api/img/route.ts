import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/server/rate-limit";

const ALLOWED_HOST = "cdn.dummyjson.com";

// Real usage here is a handful of images per dashboard load, TopProductsBanner is the only caller of this route. This leaves headroom for several page loads while still bounding a script that hammers the endpoint directly.
const RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

// Proxies a DummyJSON image at full resolution with no caching, standing in for a slow, unoptimised origin. Used exclusively by Case 1 (Image Optimization): the good path renders through next/image (resized, WebP, CDN-cached, with a fetchpriority preload); this route is what the bad path hits instead.
export async function GET(request: NextRequest) {
  // x-forwarded-for is set by the platform's edge/proxy layer (e.g. Vercel), never by the browser itself, so it's the closest thing to a real per-visitor key available in this runtime. Falls back to a shared key when absent (local dev has no proxy in front, so every request merges into one bucket). If this route were ever exposed directly with no trusted proxy in front, the header would be attacker-settable and the limit bypassable by rotating it; fine behind Vercel, worth revisiting if that assumption changes.
  const clientKey =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!checkRateLimit(clientKey, RATE_LIMIT, RATE_LIMIT_WINDOW_MS)) {
    return new Response("Too many requests", { status: 429 });
  }

  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return new Response("Missing url", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  // parsed.hostname is an exact match, not a substring check, so it can't be bypassed with tricks like a fake subdomain or userinfo (cdn.dummyjson.com@evil.com). https-only matches the protocol declared in next.config.ts's remotePatterns.
  if (parsed.hostname !== ALLOWED_HOST || parsed.protocol !== "https:") {
    return new Response("Forbidden", { status: 403 });
  }

  // Slow, uncached origin round-trip, calibrated to push LCP into the "poor" Core Web Vitals band on its own, without needing network throttling.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const upstream = await fetch(raw, { cache: "no-store" });
  if (!upstream.ok) return new Response("Upstream error", { status: 502 });

  // Falls back to image/webp only when the upstream response has no Content-Type at all, not when it has a wrong one, that case is caught below. Safe specifically because ALLOWED_HOST fixes where these bytes come from, and X-Content-Type-Options: nosniff (next.config.ts) stops the browser from reinterpreting them as anything other than what's declared here even in the worst case.
  const contentType = upstream.headers.get("content-type") ?? "image/webp";
  // Without this, the hostname allow-list alone still lets this route relay any path on the trusted host, not just images.
  if (!contentType.startsWith("image/")) {
    return new Response("Unsupported content-type", { status: 415 });
  }
  const body = await upstream.arrayBuffer();

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      // No caching: every load fetches fresh so the LCP impact stays measurable and never gets hidden by the browser cache.
      "Cache-Control": "no-store",
    },
  });
}
