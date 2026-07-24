import { cookies } from "next/headers";
import { getBannerProducts } from "@/lib/server/dashboard";
import TopProductsBannerClient, {
  type BannerSlide,
} from "./TopProductsBannerClient";

export default async function TopProductsBanner() {
  const cookieStore = await cookies();
  const isUnoptimized = cookieStore.get("imageOptimization")?.value === "on";
  const products = await getBannerProducts();

  const slides: BannerSlide[] = products.map((p) => ({
    id: p.id,
    title: p.title,
    sku: p.sku,
    // Good path: direct DummyJSON URL, Next.js <Image> optimises to WebP, resizes to container width, and adds a fetchpriority="high" preload. Bad path: route through /api/img, which adds the artificial delay from app/api/img/route.ts plus no priority hint, reliably poor LCP.
    imageUrl: isUnoptimized
      ? `/api/img?url=${encodeURIComponent(p.images[0])}`
      : p.images[0],
    marginality: p.marginality,
  }));

  return (
    <TopProductsBannerClient slides={slides} isUnoptimized={isUnoptimized} />
  );
}
