import Image from "next/image";
import { affiliateProducts } from "@/lib/affiliates";

type Row = {
  productId: string;
  award?: string;
};

type Props = {
  rows: Row[];
  caption?: string;
};

export default function ComparisonTable({ rows, caption }: Props) {
  const products = rows
    .map((r) => ({ ...r, product: affiliateProducts[r.productId] }))
    .filter((r): r is typeof r & { product: NonNullable<(typeof r)["product"]> } =>
      Boolean(r.product),
    );

  if (products.length === 0) return null;

  return (
    <div className="not-prose my-8 rounded-2xl border border-[#E5E5E5] overflow-hidden">
      {caption && (
        <div className="bg-[#0f172a] px-5 py-3">
          <p className="text-white text-sm font-semibold">{caption}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F5F5F5] border-b border-[#E5E5E5]">
              <th className="text-left px-4 py-3 font-semibold text-[#525252] text-xs uppercase tracking-wider">Product</th>
              <th className="text-left px-4 py-3 font-semibold text-[#525252] text-xs uppercase tracking-wider hidden sm:table-cell">Best For</th>
              <th className="text-left px-4 py-3 font-semibold text-[#525252] text-xs uppercase tracking-wider">Rating</th>
              <th className="text-left px-4 py-3 font-semibold text-[#525252] text-xs uppercase tracking-wider">Price</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {products.map(({ productId, award, product }) => {
              const ctaLabel = product.source === "amazon" ? "Check Price" : "View Deal";
              const imageUrl = product.imageUrl ?? "/images/products/placeholder.svg";
              return (
                <tr key={productId} className="bg-white hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] overflow-hidden flex-shrink-0">
                        <Image src={imageUrl} alt={product.name} fill sizes="40px" className="object-contain" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#0A0A0A] leading-snug text-xs sm:text-sm">{product.name}</p>
                        {award && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] px-1.5 py-0.5 rounded-full">
                            {award}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#525252] hidden sm:table-cell text-xs">
                    {product.bestFor ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-[#0A0A0A]">{product.rating.toFixed(1)}</span>
                    <span className="text-[#A3A3A3] ml-0.5">/5</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#525252] text-xs">{product.priceRange}</td>
                  <td className="px-4 py-3">
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow sponsored"
                      data-affiliate-id={productId}
                      className="inline-flex items-center gap-1 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {ctaLabel} →
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
