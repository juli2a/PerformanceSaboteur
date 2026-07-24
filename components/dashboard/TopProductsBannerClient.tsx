"use client";

import Image from "next/image";

import BannerCarousel from "@/components/dashboard/BannerCarousel";

// imageUrl is pre-computed server-side by TopProductsBanner:
//   Good path → direct DummyJSON URL (Next.js <Image> optimises it)
//   Bad path  → /api/img proxy URL   (JPEG, our server, no CDN)
export interface BannerSlide {
  id: number;
  title: string;
  sku: string;
  imageUrl: string;
  marginality: number;
}

interface Props {
  slides: BannerSlide[];
  isUnoptimized: boolean;
}

export default function TopProductsBannerClient({
  slides,
  isUnoptimized,
}: Props) {
  return (
    <div
      data-section="top-products"
      className="relative overflow-hidden rounded-xl"
    >
      <h2 className="heading-2 absolute top-4.25 left-4.25 z-10 text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.6)] @min-[640px]:top-5.5 @min-[640px]:left-5.5">
        Top Products
      </h2>

      <BannerCarousel
        slides={slides.map((slide, i) => ({
          id: slide.id,
          content: (
            <>
              {isUnoptimized ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.imageUrl}
                    alt=""
                    aria-hidden="true"
                    width={48}
                    height={48}
                    className="absolute inset-0 hidden h-full w-full scale-110 object-cover blur-md brightness-50 @min-[768px]:block"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    width={300}
                    height={300}
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                </>
              ) : (
                <>
                  <Image
                    src={slide.imageUrl}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="100vw"
                    style={{ objectFit: "cover" }}
                    className="hidden scale-110 blur-md brightness-50 @min-[768px]:block"
                    loading={i === 0 ? "eager" : undefined}
                    fetchPriority={i === 0 ? "high" : undefined}
                  />
                  <Image
                    src={slide.imageUrl}
                    alt={slide.title}
                    fill
                    sizes="100vw"
                    style={{ objectFit: "contain" }}
                    loading={i === 0 ? "eager" : undefined}
                    fetchPriority={i === 0 ? "high" : undefined}
                  />
                </>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="truncate text-lg font-semibold text-white">
                  {slide.title}
                </p>
                <p className="mt-0.5 text-sm text-white/70">{slide.sku}</p>
                <p className="mt-0.5 text-sm text-white/70">
                  GM%{" "}
                  <span className="text-lg font-bold text-pos">
                    {slide.marginality}
                  </span>
                </p>
              </div>
            </>
          ),
        }))}
      />
    </div>
  );
}
