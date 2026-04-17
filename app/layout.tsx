import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "LeanBodyEngine — Fitness, Health & Wellness",
    template: "%s | LeanBodyEngine",
  },
  description:
    "Expert fitness tips, supplement reviews, workout guides, and diet plans to help you build a healthier life.",
  metadataBase: new URL("https://fitbodyengine.com"),
  openGraph: {
    siteName: "LeanBodyEngine",
    type: "website",
    locale: "en_US",
  },
  verification: {
    google: "BahZBtGY8W-XRLIR-DrkeYGYjdlYc00nQgzWGs9pc7I",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen flex flex-col bg-white text-[#0A0A0A] antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
