import { affiliateProducts, type AffiliateProduct } from "./affiliates";

const PRODUCT_ID_REGEX = /<AffiliateProductCard\s+[^>]*productId=["']([^"']+)["']/g;

export function extractProductIds(content: string): string[] {
  const ids = new Set<string>();
  for (const match of content.matchAll(PRODUCT_ID_REGEX)) {
    ids.add(match[1]);
  }
  return Array.from(ids);
}

function parsePriceRange(priceRange: string): { low: number; high: number } | null {
  const normalized = priceRange.replace(/[–—]/g, "-");
  const match = normalized.match(/\$(\d+(?:\.\d+)?)\s*-\s*\$?(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const low = Number(match[1]);
  const high = Number(match[2]);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return null;
  return { low, high };
}

function productSchema(product: AffiliateProduct, siteUrl: string) {
  const image = product.imageUrl
    ? product.imageUrl.startsWith("http")
      ? product.imageUrl
      : `${siteUrl}${product.imageUrl}`
    : undefined;

  const price = parsePriceRange(product.priceRange);

  const offers = price
    ? {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: price.low.toFixed(2),
        highPrice: price.high.toFixed(2),
        url: product.url,
      }
    : {
        "@type": "Offer",
        priceCurrency: "USD",
        url: product.url,
        availability: "https://schema.org/InStock",
      };

  return {
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(image ? { image } : {}),
    review: {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: product.rating.toFixed(1),
        bestRating: "5",
      },
      author: {
        "@type": "Organization",
        name: "LeanBodyEngine",
        url: siteUrl,
      },
    },
    offers,
  };
}

export function buildProductListSchema(
  content: string,
  pageUrl: string,
  siteUrl: string,
): Record<string, unknown> | null {
  const ids = extractProductIds(content);
  const products = ids
    .map((id) => affiliateProducts[id])
    .filter((p): p is AffiliateProduct => Boolean(p));

  if (products.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: pageUrl,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: productSchema(product, siteUrl),
    })),
  };
}
