import type { Metadata } from "next";
import { Schibsted_Grotesk, JetBrains_Mono, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

// Marketing type: one grotesk for headings and text.
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Product prototypes use Inter, like most real business software.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// The wordmark keeps Zion's serif.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Zion Systems and Build — Frameworks for a Higher Purpose",
  description:
    "Software, IT, and marketing for churches, ministries, nonprofits, and faith-driven businesses. Scope your project in three minutes with the Zion Agent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${schibsted.variable} ${jetbrains.variable} ${cormorant.variable} ${inter.variable} scroll-smooth`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
