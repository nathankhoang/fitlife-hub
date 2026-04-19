import type { Metadata } from "next";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SITE_URL } from "@/lib/site";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

const siteTitle = "LeanBodyEngine — Fitness, Health & Wellness";
const siteDescription =
  "Expert fitness tips, supplement reviews, workout guides, and diet plans to help you build a healthier life.";

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: "%s | LeanBodyEngine",
  },
  description: siteDescription,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: "LeanBodyEngine",
    title: siteTitle,
    description: siteDescription,
    url: "/",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  verification: {
    google: "BahZBtGY8W-XRLIR-DrkeYGYjdlYc00nQgzWGs9pc7I",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LeanBodyEngine",
  url: SITE_URL,
  logo: `${SITE_URL}/opengraph-image`,
  description: siteDescription,
  sameAs: [
    "https://www.facebook.com/LeanBodyEngine",
    "https://www.instagram.com/leanbodyengine/",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LeanBodyEngine",
  url: SITE_URL,
  description: siteDescription,
  publisher: {
    "@type": "Organization",
    name: "LeanBodyEngine",
    url: SITE_URL,
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${jakarta.variable}`}>
      <head>
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}',{link_attribution:true});`,
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-screen flex flex-col bg-white text-[#0A0A0A] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
