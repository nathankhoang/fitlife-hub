import Link from "next/link";
import Image from "next/image";
import { brand } from "@/lib/brand";

type Variant = "full" | "compact";

type Props = {
  /**
   * "full" — big hero version for the /about page, with long bio and all
   * socials as labeled links.
   * "compact" — trim version for end-of-article placement.
   */
  variant?: Variant;
  /** Wrap the name in a link to the author profile page. Default true on compact, false on full. */
  linkToProfile?: boolean;
};

export default function AuthorCard({
  variant = "compact",
  linkToProfile,
}: Props) {
  const { author, socials } = brand;
  const shouldLink = linkToProfile ?? variant === "compact";
  const bio = variant === "full" ? (author.longBio ?? author.bio) : author.bio;

  const NameEl = shouldLink ? (
    <Link
      href={author.profileUrl}
      className="hover:text-[#059669] transition-colors"
    >
      {author.name}
    </Link>
  ) : (
    author.name
  );

  if (variant === "full") {
    return (
      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 md:p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <AuthorAvatar size={120} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#059669] mb-2">
              About the author
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight mb-1">
              {NameEl}
            </h2>
            {author.credentials && (
              <p className="text-sm text-[#525252] mb-4">{author.credentials}</p>
            )}
            <p className="text-[#525252] leading-relaxed text-[15px] mb-5">
              {bio}
            </p>
            {socials.length > 0 && (
              <ul className="flex flex-wrap gap-3">
                {socials.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#059669] hover:text-[#047857] transition-colors"
                    >
                      <SocialIcon platform={s.platform} />
                      {socialLabel(s.platform)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compact variant
  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-5">
      <div className="flex items-start gap-4">
        <AuthorAvatar size={56} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#059669] mb-0.5">
            About the author
          </p>
          <p className="text-base font-bold text-[#0A0A0A] leading-tight">
            {NameEl}
          </p>
          {author.credentials && (
            <p className="text-xs text-[#A3A3A3] mb-2">{author.credentials}</p>
          )}
          <p className="text-[#525252] leading-relaxed text-sm mt-1.5">
            {bio}
          </p>
          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-3 mt-3">
              {socials.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#059669] hover:text-[#047857] transition-colors"
                    aria-label={`${brand.author.name} on ${socialLabel(s.platform)}`}
                  >
                    <SocialIcon platform={s.platform} />
                    <span className="hidden sm:inline">{socialLabel(s.platform)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthorAvatar({ size }: { size: number }) {
  const { author, shortName } = brand;
  if (author.photoUrl) {
    return (
      <div
        className="relative rounded-full overflow-hidden bg-[#F5F5F5] border border-[#E5E5E5] flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={author.photoUrl}
          alt={author.name}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      </div>
    );
  }
  // Fallback: monogram tile
  return (
    <div
      className="flex-shrink-0 rounded-full bg-[#059669]/10 text-[#059669] font-bold flex items-center justify-center"
      style={{ width: size, height: size, fontSize: Math.round(size / 3) }}
      aria-hidden
    >
      {shortName}
    </div>
  );
}

function socialLabel(platform: string): string {
  switch (platform) {
    case "instagram":
      return "Instagram";
    case "youtube":
      return "YouTube";
    case "tiktok":
      return "TikTok";
    case "x":
      return "X";
    case "threads":
      return "Threads";
    case "facebook":
      return "Facebook";
    default:
      return platform;
  }
}

function SocialIcon({ platform }: { platform: string }) {
  const common = {
    className: "w-3.5 h-3.5",
    fill: "currentColor",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  } as const;
  switch (platform) {
    case "instagram":
      return (
        <svg {...common}>
          <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "threads":
      return (
        <svg {...common}>
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.32.145 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
        </svg>
      );
    default:
      return null;
  }
}
