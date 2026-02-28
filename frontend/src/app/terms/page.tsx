"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

const Terms = () => {
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
          Credexa – Terms of Service
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8">
          Last updated: 2025-08-28
        </p>

        <section className="space-y-8 leading-relaxed text-base sm:text-lg">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              1. Agreement
            </h2>
            <p>
              By accessing or using <strong>Credexa</strong>, you agree to these Terms. 
              If you do not agree, you must not use the platform.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              2. Accounts
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your 
              account credentials and ensuring that the information you provide 
              is accurate and up-to-date. You must notify us immediately of any 
              unauthorized use of your account.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              3. Acceptable Use
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You may not engage in unlawful, harmful, or abusive activity.</li>
              <li>You may not misuse, disrupt, or attempt to gain unauthorized access to the platform.</li>
              <li>You may not use Credexa for spamming, phishing, or distributing malicious software.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              4. Intellectual Property
            </h2>
            <p>
              All content, trademarks, and other intellectual property related 
              to Credexa are owned by us or our licensors. You may not copy, 
              modify, distribute, or create derivative works without prior 
              written consent.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              5. Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your access if you 
              violate these Terms or engage in activity that may harm Credexa 
              or its users. Upon termination, your right to use the platform 
              will immediately cease.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              6. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Credexa shall not be held 
              liable for indirect, incidental, or consequential damages, including 
              but not limited to loss of data, profits, or learning opportunities.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              7. Governing Law
            </h2>
            <p>
              These Terms are governed by and construed in accordance with the 
              laws of your jurisdiction, without regard to conflict of law principles.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              8. Changes to Terms
            </h2>
            <p>
              We may update these Terms from time to time. Updates will be posted 
              on this page with a revised “Last Updated” date. Continued use of 
              Credexa after changes constitutes acceptance of the new Terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              9. Contact Us
            </h2>
            <p>
              If you have questions or concerns regarding these Terms, please 
              contact us at{" "}
              <a
                href="mailto:noreplycredexa@gmail.com"
                className="text-blue-600 dark:text-blue-400 underline hover:opacity-80"
              >
                noreplycredexa@gmail.com
              </a>.
            </p>
          </div>
        </section>

        <footer className="mt-12 text-sm sm:text-base text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-6">
          This document is for informational purposes and not legal advice.
        </footer>
      </div>
    </main>
  );
};

export default Terms;
