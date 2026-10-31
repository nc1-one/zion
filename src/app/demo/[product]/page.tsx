import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoShell } from "@/components/products/DemoShell";
import { demoPath } from "@/components/products/showcase";
import { BibleStudyPrototype } from "@/components/products/bible-study";
import { ChurchOSPrototype } from "@/components/products/church-os";
import { DonorsPrototype } from "@/components/products/donors";
import { ErpPrototype } from "@/components/products/erp";
import { ChurchHRISPrototype } from "@/components/products/hris";
import { HubSpotPrototype } from "@/components/products/hubspot";
import { AIPipelinePrototype } from "@/components/products/pipeline";
import { SermonMakerPrototype } from "@/components/products/sermon";
import { StorePrototype } from "@/components/products/store";
import { PRODUCTS, type Product } from "@/lib/quotes";

// Only the app on this page ships to the browser.
const APPS: Record<Product["id"], React.ComponentType> = {
  "church-os": ChurchOSPrototype,
  pipeline: AIPipelinePrototype,
  sermon: SermonMakerPrototype,
  "bible-study": BibleStudyPrototype,
  hris: ChurchHRISPrototype,
  hubspot: HubSpotPrototype,
  donors: DonorsPrototype,
  erp: ErpPrototype,
  store: StorePrototype,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ product: p.id }));
}

const find = (id: string) => PRODUCTS.find((p) => p.id === id);

export async function generateMetadata(props: { params: Promise<{ product: string }> }): Promise<Metadata> {
  const product = find((await props.params).product);
  if (!product) return {};
  const title = `${product.name} live demo · Zion Systems & Build`;
  const description = `${product.hook} Try ${product.name} with sample data: click through every screen, add records, approve things.`;
  return {
    title,
    description,
    alternates: { canonical: demoPath(product.id) },
    openGraph: { type: "website", url: demoPath(product.id), siteName: "Zion Systems & Build", title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function DemoPage(props: { params: Promise<{ product: string }> }) {
  const product = find((await props.params).product);
  if (!product) notFound();
  const App = APPS[product.id];
  return (
    <DemoShell product={{ id: product.id, name: product.name }}>
      <App />
    </DemoShell>
  );
}
