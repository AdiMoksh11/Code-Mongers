"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

const CookiePolicy = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white-50 text-gray-800 dark:bg-black dark:text-gray-100 transition-colors duration-300">
      <header className="w-full flex justify-between items-center px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <ThemeToggleButton
          variant="gif"
          url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif"
        />
      </header>

      <div className="px-10 sm:px-15 py-10 sm:py-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight underline decoration-black dark:decoration-white">
          Credexa – Cookie Policy
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8">
          Last updated: 2025-08-28
        </p>

        <section className="space-y-8 leading-relaxed text-base sm:text-lg">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files stored on your device when you visit
              a website. They help websites recognize your device, remember your
              preferences, and improve your experience.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              2. How We Use Cookies
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Authentication – to keep you signed in to Credexa.</li>
              <li>Preferences – to remember theme and language settings.</li>
              <li>Analytics – to understand usage and improve performance.</li>
              <li>Security – to detect fraudulent or abusive behavior.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              3. Managing Cookies
            </h2>
            <p>
              You can control and delete cookies through your browser settings.
              Note that disabling essential cookies may affect the
              functionality of Credexa.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              4. Third-Party Cookies
            </h2>
            <p>
              Some third-party services we integrate (e.g., Google, GitHub,
              Facebook login) may set their own cookies. These are governed by
              the respective third-party privacy and cookie policies.
            </p>
          </div>
        </section>

        <footer className="mt-12 text-sm sm:text-base text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-6">
          This Cookie Policy should be read along with our{" "}
          <a
            href="/privacy-policy"
            className="text-blue-600 dark:text-blue-400 underline hover:opacity-80"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="/terms"
            className="text-blue-600 dark:text-blue-400 underline hover:opacity-80"
          >
            Terms of Service
          </a>
          .
        </footer>
      </div>
    </main>
  );
};

export default CookiePolicy;
