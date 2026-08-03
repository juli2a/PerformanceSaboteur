import type { NextRequest } from "next/server";

const ALLOWED_HOST = "cdn.dummyjson.com";

// Proxies a DummyJSON image at its original resolution with no caching.
// Used exclusively by Case 1 (Image Optimization) to simulate bypassing
// Next.js <Image>:
//   Good path → /_next/image  (resized to container width, WebP, CDN-cached,
//                               fetchpriority="high" preload in <head>)
//   Bad  path → /api/img      (original full resolution, no resize, our
//                               dev-server instead of CDN, no priority hint)
// A 1500 ms artificial delay simulates serving from a slow, unoptimised origin
// (no CDN, no caching). Combined with the absence of a fetchpriority preload
// hint, this reliably produces a poor LCP without requiring network throttling.
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return new Response("Missing url", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (parsed.hostname !== ALLOWED_HOST) {
    return new Response("Forbidden", { status: 403 });
  }

  // Simulate the latency of serving an unoptimized image from a slow origin
  // (no CDN, no caching, full round-trip). 1500 ms pushes LCP reliably into
  // the "poor" band (>4 s total when combined with image download time) so the
  // difference from the optimized path is visible without network throttling.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const upstream = await fetch(raw, { cache: "no-store" });
  if (!upstream.ok) return new Response("Upstream error", { status: 502 });

  const contentType = upstream.headers.get("content-type") ?? "image/webp";
  const body = await upstream.arrayBuffer();

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      // No caching — every load fetches fresh so the LCP impact is always measurable and never hidden by the browser cache.
      "Cache-Control": "no-store",
    },
  });
}
