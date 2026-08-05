# Case 1: Image Optimization

**Category:** Rendering / Media optimization
**Toggle:** Rendering → Unoptimized Images
**Metric:** LCP

## Summary
The impact of skipping Next.js Image Optimization (and the priority hint for the LCP element) on the LCP metric. Demonstrated on the first slide of the Dashboard's hero banner — that slide is the page's actual LCP element.

---

## Good code (Toggle OFF)

**Implementation:** `components/dashboard/TopProductsBannerClient.tsx`
```tsx
{slides.map((slide, i) => (
  <Image
    src={slide.imageUrl}
    alt={slide.title}
    fill
    sizes="100vw"
    style={{ objectFit: "contain" }}
    loading={i === 0 ? "eager" : undefined}
    fetchPriority={i === 0 ? "high" : undefined}
  />
))}
```
`imageUrl` is a direct DummyJSON link (`p.images[0]`), which `next/image` optimizes (resizing, WebP, CDN cache).

**UI behavior:**
- The banner's first slide gets `fetchPriority="high"` and `loading="eager"` — the browser loads it immediately and with priority.
- LCP stays in the good/needs-improvement zone.

---

## Bad code (Toggle ON)

**Implementation:** `components/dashboard/TopProductsBannerClient.tsx` + `app/api/img/route.ts`
```tsx
{slides.map((slide, i) => (
  <img
    src={slide.imageUrl} // /api/img?url=... instead of the direct URL
    alt={slide.title}
    width={300}
    height={300}
    className="absolute inset-0 h-full w-full object-contain"
  />
))}
```
`imageUrl` now points to the `/api/img` proxy route, which:
- is never cached (`Cache-Control: no-store`);
- always returns the original, unresized image, bypassing `next/image`;
- adds an artificial 1500ms delay, simulating a slow origin with no CDN.

The first slide also loses its `fetchPriority`/`loading="eager"` hint — it loads exactly like any offscreen slide.

**UI behavior:**
- The toggle is written to the `imageOptimization` cookie and read by the `TopProductsBanner` server component (SSR) — flipping it reloads the page.
- Banner LCP rises noticeably (1500ms proxy delay + missing priority hint) and lands in the "poor" zone of the metrics panel.

---

## Analysis

**Demonstration success probability: 8/10**
The `/api/img` delay (1500ms) is deterministic and independent of the user's network, so the LCP difference reproduces reliably. The only risk is if the origin request to `cdn.dummyjson.com` itself hangs longer than expected.

**UI/case fit:** ✅ Full. The Dashboard banner (`TopProductsBanner`) is the first thing the user sees, making it a correct LCP candidate to demonstrate.

**API:** ✅ `product.images[0]` exists on every DummyJSON `/products` object; the `/api/img` proxy is restricted to the `cdn.dummyjson.com` host.
