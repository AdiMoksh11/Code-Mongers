"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

const DataDeletion = () => {
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
          Credexa – Data Deletion
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8">
          Last updated: 2025-08-28
        </p>

        <section className="space-y-8 leading-relaxed text-base sm:text-lg">
          <p>
            You may request deletion of your Credexa account and all
            associated data at any time. We will permanently delete or
            anonymize your data unless we are required to retain certain
            information for legal, regulatory, or compliance purposes.
          </p>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              Option A – In-App
            </h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Sign in to your Credexa account.</li>
              <li>
                Navigate to <strong>Settings → Account → Delete Account</strong>.
              </li>
              <li>Review and confirm the deletion request.</li>
            </ol>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              Option B – Email Request
            </h2>
            <p>
              Send an email with the subject line{" "}
              <em>“Credexa Data Deletion Request”</em> to{" "}
              <a
                href="mailto:support@credexa.com"
                className="text-blue-600 dark:text-blue-400 underline hover:opacity-80"
              >
                support@credexa.com
              </a>
              . Please include the email address linked to your account for
              verification.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              Third-Party Login Users
            </h2>
            <p>
              If you signed up using a third-party service (e.g., Google,
              LinkedIn, or Facebook), you may also revoke Credexa’s access
              from the respective platform’s{" "}
              <em>Apps and Permissions</em> settings. This will prevent any
              future data sharing with Credexa.
            </p>
          </div>
        </section>

        <footer className="mt-12 text-sm sm:text-base text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-6">
          This page is for informational purposes only and does not constitute
          legal advice.
        </footer>
      </div>
    </main>
  );
};

export default DataDeletion;
