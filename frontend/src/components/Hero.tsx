"use client";

import React, { useEffect, useState } from "react";
import WrapButton from "@/components/ui/wrap-button"; 
import { CardCarousel } from "@/components/ui/card-carousel";
import { Globe, LayoutDashboard, LogOut, LogOutIcon } from "lucide-react";

export default function HeroSection() {
  const images = [
    { src: "/images/card/Card-1.png", alt: "Credexa Student Dashboard" },
    { src: "/images/card/Card-2.png", alt: "AI Rubric Builder" },
    { src: "/images/card/Card-3.png", alt: "Verifiable Credential Badge" },
    { src: "/images/card/Card-4.png", alt: "Public Verification Page" },
  ];

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token); 
  }, []);
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    window.location.href = "/";
  };


  return (
    <section className="relative overflow-hidden pt-0 md:pt-10">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-start md:justify-between gap-12 relative z-10">
        <div className="md:w-3/5 mt-8 flex flex-col items-start text-left space-y-4">
          <h1 
            className="text-4xl md:text-5xl lg:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white animate-[fadeInUp_0.8s_ease-out_forwards]"
            style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
          >
            Credexa - <br className="hidden lg:block" /> <span className="text-blue-600 dark:text-blue-400">Lifelong Skill Passport</span>
          </h1>

          <p 
            className="text-lg lg:text-xl text-gray-700 dark:text-gray-200 max-w-lg animate-[fadeInUp_0.8s_ease-out_forwards]"
            style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}
          >
            AI-powered platform to collect, verify, and organize all your micro-credentials in one trusted profile.
          </p>

          <div 
            className="flex gap-4 flex-col sm:flex-row mt-4 animate-[fadeInUp_0.8s_ease-out_forwards]"
            style={{ animationDelay: '0.6s', animationFillMode: 'backwards' }}
          >
            {!isLoggedIn ? (
              <WrapButton href="/signup" className="group">
               <Globe className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-[360deg]" />
                Get Started
              </WrapButton>
              ) : (
              <WrapButton onClick={handleLogout} className="group">
                Logout
              </WrapButton>
            )}

            <WrapButton href="/dashboard" className="group">
              <LayoutDashboard className="mr-2 w-5 h-5 transition-transform duration-300 group-hover:rotate-6" />
              Dashboard
            </WrapButton>
          </div>
        </div>

        <div 
          className="mt-5 md:mt-2 w-full max-w-xl md:max-w-2xl lg:max-w-xl border border-zinc-300 dark:border-zinc-700 rounded-3xl p-6 
                     bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md shadow-2xl 
                     transition-all duration-300 hover:shadow-blue-500/20 hover:dark:shadow-blue-400/20 hover:-translate-y-2
                     animate-[fadeInUp_0.8s_ease-out_forwards]"
          style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}
        >
          <CardCarousel
            images={images}
            autoplayDelay={3000}
            showPagination={true}
            showNavigation={true}
          />
        </div>
      </div>
    </section>
  );
}
