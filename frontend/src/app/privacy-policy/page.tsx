"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

const PrivacyPolicy = () => {
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
          Credexa – Privacy Policy
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8">
          Last updated: 2025-08-28
        </p>

        <section className="space-y-8 leading-relaxed text-base sm:text-lg">
          <p>
            This Privacy Policy explains how <strong>Credexa</strong> (“we”, “us”, or “our”) collects, uses, and protects information when you use our platform to manage, verify, and explore micro-credentials and Proof of Learning records. We are committed to protecting your privacy and ensuring your personal information is handled responsibly.
          </p>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              Information We Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account info:</strong> name, email, profile photo, institutional affiliation, and linked identity provider details (e.g., Google or LinkedIn ID).</li>
              <li><strong>Credential data:</strong> digital certificates, badges, transcripts, verification requests, and related metadata.</li>
              <li><strong>Technical data:</strong> IP address, device, browser, operating system, usage logs, cookies, analytics data.</li>
              <li><strong>Support communications:</strong> messages, feedback, and inquiries you send to us.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              How We Use Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Authenticate and manage your account.</li>
              <li>Enable credential submissions, storage, and verification.</li>
              <li>Issue, store, and verify Proof of Learning and micro-credentials.</li>
              <li>Maintain security, prevent fraud, detect abuse, and debug issues.</li>
              <li>Analyze usage trends and improve the platform experience.</li>
              <li>Comply with legal obligations and enforce our policies.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              Legal Basis for Processing
            </h2>
            <p>
              We process personal data based on your consent, to fulfill contractual obligations (e.g., providing credentials), comply with legal requirements, or to protect legitimate interests such as credential verification, security, and fraud prevention.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              Data Retention
            </h2>
            <p>
              We retain personal information only as long as necessary to deliver our services, maintain verifiable credentials, comply with legal obligations, resolve disputes, and enforce agreements. Credential records may remain anchored on-chain as permanent proofs, but identifying metadata can be deleted or anonymized upon request.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              Your Rights
            </h2>
            <p className="mb-2">
              You may access, update, or delete your personal data at any time. For deletion, visit our{" "}
              <a href="/data-deletion" className="text-blue-600 dark:text-blue-400 underline hover:opacity-80">
                Data Deletion
              </a>{" "}
              page or contact{" "}
              <a href="mailto:support@credexa.com" className="text-blue-600 dark:text-blue-400 underline hover:opacity-80">
                support@credexa.com
              </a>. You also have the right to object to certain processing activities and request a copy of your data in a portable format.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              Data Security
            </h2>
            <p>
              We implement industry-standard security measures to protect your information from unauthorized access, disclosure, alteration, or destruction. While we take strong precautions, no system is completely secure, so please use caution when sharing sensitive information.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              Third-Party Services
            </h2>
            <p>
              Credexa integrates with third-party services such as cloud storage, blockchain networks, and authentication providers (e.g., Google, LinkedIn). These services have their own privacy policies, and your data may be shared with them according to those policies.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              Cookies
            </h2>
            <p>
              We use cookies and similar technologies to improve user experience, analyze platform usage, and support authentication. You can manage cookie preferences via your browser settings.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              International Users
            </h2>
            <p>
              Your data may be stored and processed in countries other than your own. We take appropriate measures to ensure your personal information remains protected in accordance with applicable laws and academic data protection standards.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              Children’s Privacy
            </h2>
            <p>
              Our services are not directed to children under 13, and we do not knowingly collect personal information from them. If we become aware that a child has provided us with personal data, we will take steps to delete it promptly unless required for verified institutional use cases with consent.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated “Last Updated” date. Please review periodically to stay informed about how we protect your information.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              Contact Us
            </h2>
            <p>
              For questions regarding this Privacy Policy or our data practices, please contact us at{" "}
              <a href="mailto:support@credexa.com" className="text-blue-600 dark:text-blue-400 underline hover:opacity-80">
                support@credexa.com
              </a>.
            </p>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 underline decoration-black dark:decoration-white">
              Additional Resources
            </h2>
            <p>
              You may also review our <a href="/terms" className="text-blue-600 dark:text-blue-400 underline hover:opacity-80">Terms of Service</a> and <a href="/cookies" className="text-blue-600 dark:text-blue-400 underline hover:opacity-80">Cookie Policy</a> for more details on our policies.
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

export default PrivacyPolicy;
