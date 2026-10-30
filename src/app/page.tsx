import { Navbar } from "@/components/shared/Navbar";
import { AssessmentProvider } from "@/components/assessment/AssessmentProvider";
import { Assessment } from "@/components/assessment/Assessment";
import { Value } from "@/components/sections/Value";
import { Products } from "@/components/sections/Products";
import { Offerings } from "@/components/sections/Offerings";
import { Portfolio } from "@/components/sections/Portfolio";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/shared/Footer";

export default function Home() {
  return (
    <AssessmentProvider>
      <Navbar />
      <main className="min-h-screen">
        <Assessment />
        <Value />
        <Products />
        <Offerings />
        <Portfolio />
        <Contact />
      </main>
      <Footer />
    </AssessmentProvider>
  );
}
