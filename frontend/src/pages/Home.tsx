"use client";

import React from "react";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import UseCase from "@/components/UseCase";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import { Performance3DProvider } from "@/components/3d/Performance3DProvider";
import Ambient3DBackground from "@/components/3d/Ambient3DBackground";
import AnimatedBackgroundIcons from "@/components/AnimatedBackgroundIcons";
import FloatingParticles from "@/components/FloatingParticles";

const SmoothScrollStyle = () => {
  return (
    <style>
      {`
        html {
          scroll-behavior: smooth;
        }
      `}
    </style>
  );
};

export default function Page() {
  return (
    <Performance3DProvider>
      <div className="bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 min-h-screen relative">
        <SmoothScrollStyle />
        
        <FloatingParticles />
        
        <Ambient3DBackground intensity={0.6} />
        
        <AnimatedBackgroundIcons />
        
        <div className="relative z-10">
          <Navbar />
          <Hero />
          <Features />
          <HowItWorks />
          <UseCase />
          <Testimonials />
          <div id="contact">
            <Contact />
          </div>
          <Footer />
        </div>
      </div>
    </Performance3DProvider>
  );
}
