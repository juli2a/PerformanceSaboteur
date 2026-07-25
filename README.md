# Frontend Anti-Patterns & Performance Sandbox 🚀

An interactive educational demo B2B analytics dashboard (Dashboard + Inventory Control) designed to visualize and measure the real-time impact of common frontend anti-patterns.

**Fully optimized for both desktop and mobile viewports — see how performance degrades on different form factors and hardware.**

**Stop talking about performance in theory — see it in action with live metrics.**

👉 [**Live Demo Link**](https://performance-saboteur.vercel.app/)

---

## ⚡ What is this?

This project looks and feels like a real, working production interface. However, it allows you to deliberately toggle well-known frontend performance bottlenecks to observe exactly how they affect core web vitals and user experience.

Instead of reading dry documentation, you can watch how the UI stutters, identify where the LCP/CLS hits come from, and examine side-by-side code comparisons.

## 🛠️ Features & Capabilities

- **Interactive Control Panel:** Toggle anti-patterns across three categories: Network, Rendering, and Computing.
- **Effect Stacking:** Combine multiple toggles to see how performance issues compound.
- **Live Metrics Tracker:** Watch LCP, CLS, INP, and other vital metrics update instantly at the bottom of the screen.
- **Flash on Update:** Visualize component re-renders in real-time under stress.
- **Case Guides:** Each toggle includes a short breakdown, reproduction steps, and a bad vs. good code comparison.

## 🧰 Tech Stack

- **Frontend:** Next.js 16 (App Router, TypeScript), React 19
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **State Management:** Zustand
- **Metrics tracking:** Custom performance observers / Web Vitals API
- **Data:** DummyJSON (real HTTP calls, no local mocks)

## ⚙️ Local Development (Optional)

If you want to run this project locally:

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Run the development server:
   ```bash
   pnpm dev
   ```
3. Run tests:
   ```bash
   pnpm test
   pnpm test:e2e
   ```

---

💡 _Note: Blocking Time and Interaction Latency only update when a new qualifying event happens (e.g., a Long Task over 50ms). They represent the metric doing its job, not the current live state of the app._

💡 _Note: Fast CPUs, CDNs, and production build optimizations can sometimes mask these anti-patterns — the same toggle may look far less dramatic on strong hardware than on an average device. See the in-app **About** section for more on this._
