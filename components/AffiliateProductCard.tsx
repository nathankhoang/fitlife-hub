import { affiliateProducts } from "@/lib/affiliates";

type Props = {
  productId: string;
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f${i}`} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {half && (
        <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm text-[#6B7280] ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function AffiliateProductCard({ productId }: Props) {
  const product = affiliateProducts[productId];
  if (!product) return null;

  const ctaLabel =
    product.source === "amazon" ? "Check Price on Amazon" : "View Deal";

  return (
    <div className="not-prose my-6 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start">
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 flex items-center justify-center min-w-[80px] min-h-[80px] text-4xl flex-shrink-0">
        {product.source === "amazon" ? "🛒" : "🏷️"}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#16A34A] uppercase tracking-wide mb-1">
          {product.source === "amazon" ? "Amazon" : product.source === "clickbank" ? "ClickBank" : "ShareASale"}
        </p>
        <h4 className="text-[#111827] font-bold text-base mb-1 leading-snug">
          {product.name}
        </h4>
        <StarRating rating={product.rating} />
        <p className="text-[#6B7280] text-sm mt-2 leading-relaxed">
          {product.description}
        </p>
        <div className="flex items-center gap-4 mt-3">
          <span className="text-[#111827] font-semibold text-sm">
            {product.priceRange}
          </span>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="inline-block bg-[#F97316] hover:bg-[#EA6C0A] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {ctaLabel} →
          </a>
        </div>
      </div>
    </div>
  );
}
