import { Navbar } from "@/components/shared/Navbar";
import { AssessmentProvider } from "@/components/assessment/AssessmentProvider";
import { Assessment } from "@/components/assessment/Assessment";
import { Offerings } from "@/components/sections/Offerings";
import { UseCases } from "@/components/sections/UseCases";
import { AgentGuide } from "@/components/agent/AgentGuide";
import { ZPL } from "@/components/sections/ZPL";
import { Portfolio } from "@/components/sections/Portfolio";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/shared/Footer";

export default function Home() {
  return (
    <AssessmentProvider>
      <Navbar />
      <main className="min-h-screen">
        <Assessment />
        <Offerings />
        <UseCases />
        <ZPL />
        <Portfolio />
        <About />
        <Contact />
      </main>
      <Footer />
      <AgentGuide />
    </AssessmentProvider>
  );
}
