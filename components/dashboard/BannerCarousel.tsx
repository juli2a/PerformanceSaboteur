"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface BannerCarouselSlide {
  id: number | string;
  content: React.ReactNode;
}

interface BannerCarouselProps {
  slides: BannerCarouselSlide[];
}

// Owns the scroll mechanics (autoplay, arrows, dot navigation) so the caller only supplies each slide's already-rendered content.
export default function BannerCarousel({ slides }: BannerCarouselProps) {
  // Lazy-initialized once so the plugin instance stays stable across renders, passing a fresh Autoplay() every render would re-init the carousel and keep resetting its delay timer.
  const [plugins] = useState(() => [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, plugins);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  return (
    <>
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide) => (
            <div
              key={slide.id}
              // position set inline (not just via the "relative" class) so the fill-positioned <Image> inside always has a positioned ancestor to size against, even on the first paint before Tailwind's stylesheet has been applied.
              style={{ position: "relative" }}
              className="h-75 min-w-full shrink-0 overflow-hidden bg-surface-2"
            >
              {slide.content}
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={scrollPrev}
        aria-label="Previous slide"
        className="absolute top-1/2 left-3 z-10 -translate-y-1/2"
      >
        <ChevronLeft size={16} />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={scrollNext}
        aria-label="Next slide"
        className="absolute top-1/2 right-3 z-10 -translate-y-1/2"
      >
        <ChevronRight size={16} />
      </Button>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "size-1.5 rounded-full transition-colors",
              i === selectedIndex
                ? "bg-white"
                : "bg-white/40 hover:bg-white/60",
            )}
          />
        ))}
      </div>
    </>
  );
}
