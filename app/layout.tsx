import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SITE_URL } from "@/lib/site";

const geist = Geist({ subsets: ["latin"] });

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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen flex flex-col bg-white text-[#0A0A0A] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
