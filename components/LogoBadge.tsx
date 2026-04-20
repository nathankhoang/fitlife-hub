import Image from "next/image";
import { brand } from "@/lib/brand";

type Props = {
  /** Tailwind sizing class. Defaults to `w-8 h-8` for nav/footer use. */
  sizeClassName?: string;
  /** Text size for the monogram fallback. */
  textSizeClassName?: string;
};

export function LogoBadge({
  sizeClassName = "w-8 h-8",
  textSizeClassName = "text-[11px]",
}: Props) {
  const { logoUrl } = brand.theme;

  if (logoUrl) {
    return (
      <span
        className={`${sizeClassName} rounded-lg overflow-hidden flex items-center justify-center bg-white`}
      >
        <Image
          src={logoUrl}
          alt={`${brand.name} logo`}
          width={32}
          height={32}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`${sizeClassName} rounded-lg flex items-center justify-center text-white ${textSizeClassName} font-bold tracking-tight`}
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      {brand.shortName}
    </span>
  );
}
