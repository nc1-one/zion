import type { MetadataRoute } from "next";
import { demoPath } from "@/components/products/showcase";
import { PRODUCTS } from "@/lib/quotes";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://zionsystems.dev", lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    ...PRODUCTS.map((p) => ({ url: `https://zionsystems.dev${demoPath(p.id)}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
