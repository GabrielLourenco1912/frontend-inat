import { About } from "@/components/landing/About";
import { Apprenticeship } from "@/components/landing/Apprenticeship";
import { Contact } from "@/components/landing/Contact";
import { Footer } from "@/components/landing/Footer";
import { ForCompanies } from "@/components/landing/ForCompanies";
import { ForYouth } from "@/components/landing/ForYouth";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Impact } from "@/components/landing/Impact";
import { InternalSystem } from "@/components/landing/InternalSystem";
import { Location } from "@/components/landing/Location";
import { ScrollAnimations } from "@/components/landing/ScrollAnimations";
import { SocialMedia } from "@/components/landing/SocialMedia";
import { Testimonials } from "@/components/landing/Testimonials";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <ScrollAnimations />
        <Hero />
        <About />
        <Apprenticeship />
        <ForYouth />
        <ForCompanies />
        <Impact />
        <Testimonials />
        <SocialMedia />
        <InternalSystem />
        <Contact />
        <Location />
      </main>
      <Footer />
    </>
  );
}
