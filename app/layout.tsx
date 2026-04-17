import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "FitBodyEngine — Fitness, Health & Wellness",
    template: "%s | FitBodyEngine",
  },
  description:
    "Expert fitness tips, supplement reviews, workout guides, and diet plans to help you build a healthier life.",
  metadataBase: new URL("https://leanbodyengine.com"),
  openGraph: {
    siteName: "FitBodyEngine",
    type: "website",
    locale: "en_US",
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
