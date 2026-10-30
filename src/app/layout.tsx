import type { Metadata } from "next";
import { Schibsted_Grotesk, JetBrains_Mono, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

// Marketing type: one grotesk for headings and text.
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

// Only the heading/body face is preloaded; the rest load when first used.
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  preload: false,
});

// Product prototypes use Inter, like most real business software.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  preload: false,
});

// The wordmark keeps Zion's serif.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["600", "700"],
  preload: false,
});

const description = "Software, IT, and marketing for churches, ministries, nonprofits, and faith-driven businesses. Scope your project in three minutes with the Zion Agent.";

export const metadata: Metadata = {
  metadataBase: new URL("https://zionsystems.dev"),
  title: "Zion Systems & Build: software built with excellence, priced for the mission",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Zion Systems & Build",
    title: "Know what to build before you build it.",
    description,
  },
  twitter: { card: "summary_large_image", title: "Know what to build before you build it.", description },
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
