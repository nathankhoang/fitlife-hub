import Image from "next/image";
import { affiliateProducts } from "@/lib/affiliates";

type Props = {
  productId: string;
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f${i}`} className="w-3.5 h-3.5 text-[#F59E0B] fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {half && (
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#E5E5E5" />
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e${i}`} className="w-3.5 h-3.5 text-[#E5E5E5] fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs font-medium text-[#525252] ml-1.5">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function AffiliateProductCard({ productId }: Props) {
  const product = affiliateProducts[productId];
  if (!product) return null;

  const ctaLabel =
    product.source === "amazon" ? "Check Price on Amazon" : "View Deal";

  const sourceLabel =
    product.source === "amazon"
      ? "Amazon"
      : product.source === "clickbank"
        ? "ClickBank"
        : "ShareASale";

  const imageUrl = product.imageUrl ?? "/images/products/placeholder.svg";

  return (
    <div className="not-prose my-8 bg-white border border-[#E5E5E5] rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-start hover:border-[#A3A3A3] transition-colors">
      <div className="relative bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center overflow-hidden flex-shrink-0">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="128px"
          className="object-contain"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-[0.12em] mb-1.5">
          {sourceLabel} · Affiliate
        </p>
        <h4 className="text-[#0A0A0A] font-semibold text-base mb-1.5 leading-snug tracking-tight">
          {product.name}
        </h4>
        <StarRating rating={product.rating} />
        <p className="text-[#525252] text-sm mt-2.5 leading-relaxed">
          {product.description}
        </p>
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <span className="text-[#0A0A0A] font-semibold text-sm">
            {product.priceRange}
          </span>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="inline-flex items-center gap-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {ctaLabel}
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
