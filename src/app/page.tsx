import { Navbar } from "@/components/shared/Navbar";
import { AssessmentProvider } from "@/components/assessment/AssessmentProvider";
import { Assessment } from "@/components/assessment/Assessment";
import { Value } from "@/components/sections/Value";
import { Products } from "@/components/sections/Products";
import { Offerings } from "@/components/sections/Offerings";
import { Portfolio } from "@/components/sections/Portfolio";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/shared/Footer";

// Structured data so search engines know who Zion is and what it offers.
const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Zion Systems & Build",
  url: "https://zionsystems.dev",
  logo: "https://zionsystems.dev/logo.png",
  email: "support@zionsystems.dev",
  telephone: "+63 908 890 1896",
  slogan: "Frameworks for a higher purpose",
  description: "Software, IT, and marketing for churches, ministries, nonprofits, schools, and faith-driven businesses.",
  address: { "@type": "PostalAddress", addressLocality: "Manila", addressCountry: "PH" },
  knowsAbout: ["Custom software", "Church management software", "Managed IT services", "Cybersecurity", "Digital marketing", "UI/UX design"],
};

export default function Home() {
  return (
    <AssessmentProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION) }} />
      <Navbar />
      <main className="min-h-screen">
        <Assessment />
        <Value />
        <Products />
        <Offerings />
        <Portfolio />
        <About />
        <Contact />
      </main>
      <Footer />
    </AssessmentProvider>
  );
}
