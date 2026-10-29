import type { Metadata } from "next";
import { Outfit, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Zion Systems and Build — Frameworks for a Higher Purpose",
  description:
    "Scope your next website, app, or system with the Zion Agent: paste your website, answer a few questions, and get a roadmap, deliverables, timeline, and cost. IT development, marketing, and servicing for churches, ministries, and faith-driven businesses building awesome things for the Kingdom.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrains.variable} ${cormorant.variable} scroll-smooth`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
