import Link from "next/link";
import { type Category, categoryLabels } from "@/lib/articles";

const categoryColors: Record<Category, string> = {
  "home-workouts": "bg-emerald-50 text-emerald-800 ring-emerald-200/60",
  supplements: "bg-violet-50 text-violet-800 ring-violet-200/60",
  "diet-nutrition": "bg-lime-50 text-lime-800 ring-lime-200/60",
  "weight-loss": "bg-amber-50 text-amber-800 ring-amber-200/60",
  "muscle-building": "bg-rose-50 text-rose-800 ring-rose-200/60",
  wellness: "bg-teal-50 text-teal-800 ring-teal-200/60",
};

type Props = {
  category: Category;
  linkable?: boolean;
};

export default function CategoryBadge({ category, linkable = true }: Props) {
  const className = `inline-block text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${categoryColors[category]}`;
  const label = categoryLabels[category];

  if (linkable) {
    return (
      <Link href={`/category/${category}`} className={className}>
        {label}
      </Link>
    );
  }

  return <span className={className}>{label}</span>;
}
