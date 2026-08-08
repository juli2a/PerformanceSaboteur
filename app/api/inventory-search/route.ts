import { NextResponse, type NextRequest } from "next/server";
import { apiFetch } from "@/lib/server/fetcher";

interface SearchableProduct {
  id: number;
  title: string;
  sku: string;
}

interface ProductsResponse {
  products: SearchableProduct[];
}

// Case 4 (Network → Race Condition) needs latency that's inversely related to query length: short queries typed first resolve slower than the longer queries typed right after them, so a naive client can have an older response land after a newer one. The bounds below are the ones used in docs/case4.md's worked example ("i" vs "iphone").
function getArtificialDelay(query: string): number {
  return Math.max(200, 1500 - (query.length - 1) * 260);
}

const MAX_QUERY_LENGTH = 60;

// DummyJSON's own /products/search also matches description/category/brand, fields the table never shows, which makes results look wrong to a user typing a name or SKU. This fetches the base catalogue and matches title/sku locally instead of trusting DummyJSON's broader match, returning just the matched ids since the client already holds the full amplified dataset and only needs to know which base products matched.
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) return NextResponse.json({ ids: [] });
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  await new Promise((resolve) =>
    setTimeout(resolve, getArtificialDelay(query)),
  );

  const { products } = await apiFetch<ProductsResponse>(
    "/products?limit=100&select=id,title,sku",
  );

  const normalizedQuery = query.toLowerCase();
  const ids = products
    .filter(
      (product) =>
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.sku.toLowerCase().includes(normalizedQuery),
    )
    .map((product) => product.id);

  return NextResponse.json({ ids });
}
