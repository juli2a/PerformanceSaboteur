import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

import TopProductsBannerClient, {
  type BannerSlide,
} from "@/components/dashboard/TopProductsBannerClient";

// BannerCarousel wraps real embla-carousel-react, which handles autoplay, swipe and dot navigation, none of that is what Case 1 demonstrates. Stubbed here so the test exercises only the good/bad image markup this component builds for `slide.content`, not embla's own mechanics.
vi.mock("@/components/dashboard/BannerCarousel", () => ({
  default: ({ slides }: { slides: { id: number; content: React.ReactNode }[] }) => (
    <div>
      {slides.map((slide) => (
        <div key={slide.id}>{slide.content}</div>
      ))}
    </div>
  ),
}));

const slides: BannerSlide[] = [
  { id: 1, title: "First", sku: "SKU-1", imageUrl: "/img-1.jpg", marginality: 20 },
  { id: 2, title: "Second", sku: "SKU-2", imageUrl: "/img-2.jpg", marginality: 15 },
];

// components/dashboard/TopProductsBannerClient.tsx, badCode/goodCode from lib/simulator-cases.ts (Case 1, imageOptimization): bad path renders every slide as a plain <img> with no priority hint; good path renders next/image, and only the first slide (the real LCP element) gets fetchPriority="high" + loading="eager", the rest stay lazy by default.
describe("TopProductsBannerClient", () => {
  it("bad path (isUnoptimized=true): renders plain <img> tags with no priority hint", () => {
    const { container } = render(
      <TopProductsBannerClient slides={slides} isUnoptimized={true} />,
    );

    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThan(0);
    images.forEach((img) => {
      expect(img).not.toHaveAttribute("fetchpriority");
    });
  });

  it("good path (isUnoptimized=false): only the first slide's next/image gets priority", () => {
    const { container } = render(
      <TopProductsBannerClient slides={slides} isUnoptimized={false} />,
    );

    const images = Array.from(container.querySelectorAll("img"));

    // next/image renders <img loading="eager" fetchpriority="high" ...> for the first slide's two layers (blurred background + real image); every later slide must have neither attribute.
    const firstSlideImages = images.slice(0, 2);
    firstSlideImages.forEach((img) => {
      expect(img).toHaveAttribute("loading", "eager");
      expect(img).toHaveAttribute("fetchpriority", "high");
    });

    const laterSlideImages = images.slice(2);
    expect(laterSlideImages.length).toBeGreaterThan(0);
    laterSlideImages.forEach((img) => {
      expect(img).not.toHaveAttribute("fetchpriority");
      expect(img).not.toHaveAttribute("loading", "eager");
    });
  });
});
