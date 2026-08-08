import { Preloader } from "@/components/home/Preloader";
import { CustomCursor } from "@/components/home/CustomCursor";
import { Header } from "@/components/home/Header";
import { Hero } from "@/components/sections/Hero";
import { IntroVideo } from "@/components/home/IntroVideo";
import { Marquee } from "@/components/home/Marquee";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { StatsSection } from "@/components/home/StatsSection";
import { CTASection } from "@/components/home/CTASection";
import { Footer } from "@/components/home/Footer";

// Vidhyora landing page, restyled on the Acjon "Digital Agency" template
// (templates/acjon/index.html): preloader, glassy header, dark hero + 3D
// preview, keyword marquees, features grid, light "how it works" band,
// count-up stats, big CTA and a marquee footer.
export default function HomePage() {
  return (
    <>
      <CustomCursor />
      <Preloader />
      <Header />
      <main>
        <Hero />
        <IntroVideo />
        <Marquee />
        <FeaturesSection />
        <HowItWorks />
        <StatsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
