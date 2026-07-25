"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface EdgeScrollerProps {
  children: React.ReactNode;
  // Applied to the scrollable row itself (e.g. to set its own flex/gap layout); the component's root and arrow buttons are styled internally.
  className?: string;
  scrollLeftLabel?: string;
  scrollRightLabel?: string;
}

// Horizontally-scrollable row with edge-jump arrow buttons instead of a visible scrollbar. Arrows only render once the content actually overflows, e.g. the simulator's control panel on narrower desktop screens.
export default function EdgeScroller({
  children,
  className,
  scrollLeftLabel = "Scroll left",
  scrollRightLabel = "Scroll right",
}: EdgeScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Re-checked on resize and once scrolling actually stops. Using "scrollend" instead of "scroll" avoids a setState (→ re-render) on every scroll frame, which fights the browser's smooth-scroll animation and makes it look jerky.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateScrollState = () => {
      setHasOverflow(el.scrollWidth > el.clientWidth + 1);
      setCanScrollLeft(el.scrollLeft > 1);
      setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 1);
    };

    updateScrollState();
    el.addEventListener("scrollend", updateScrollState);
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => {
      el.removeEventListener("scrollend", updateScrollState);
      observer.disconnect();
    };
  }, []);

  // Lets the mouse wheel drive horizontal scrolling on desktop. Attached as a native listener (not React's onWheel) with { passive: false }: React registers wheel handlers passively at the root, so preventDefault() in a JSX onWheel prop is silently ignored and the page keeps scrolling too.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // One click jumps all the way to the edge, not just one step: there's nothing else to reveal in between.
  const scrollToStart = () =>
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  const scrollToEnd = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex min-w-0 flex-1 items-center">
      {hasOverflow && (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollToStart}
          disabled={!canScrollLeft}
          aria-label={scrollLeftLabel}
          className="mr-4 shrink-0"
        >
          <ChevronLeft size={16} />
        </Button>
      )}
      <div
        ref={scrollRef}
        className={cn(
          "scrollbar-hidden flex min-w-0 flex-1 items-center overflow-x-auto overflow-y-hidden",
          hasOverflow && "cursor-ew-resize",
          className,
        )}
      >
        {children}
      </div>
      {hasOverflow && (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollToEnd}
          disabled={!canScrollRight}
          aria-label={scrollRightLabel}
          className="ml-4 shrink-0"
        >
          <ChevronRight size={16} />
        </Button>
      )}
    </div>
  );
}
