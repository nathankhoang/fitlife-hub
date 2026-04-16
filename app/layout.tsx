import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "FitLife Hub — Fitness, Health & Wellness",
    template: "%s | FitLife Hub",
  },
  description:
    "Expert fitness tips, supplement reviews, workout guides, and diet plans to help you build a healthier life.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    siteName: "FitLife Hub",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen flex flex-col bg-white text-[#111827] antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
