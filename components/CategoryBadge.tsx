import Link from "next/link";
import { type Category, categoryLabels } from "@/lib/articles";

const categoryColors: Record<Category, string> = {
  "home-workouts": "bg-blue-100 text-blue-700",
  supplements: "bg-purple-100 text-purple-700",
  "diet-nutrition": "bg-yellow-100 text-yellow-700",
  "weight-loss": "bg-orange-100 text-orange-700",
  "muscle-building": "bg-red-100 text-red-700",
  wellness: "bg-green-100 text-green-700",
};

type Props = {
  category: Category;
  linkable?: boolean;
};

export default function CategoryBadge({ category, linkable = true }: Props) {
  const className = `inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColors[category]}`;
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
