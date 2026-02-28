"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AnimationPanel from "@/components/auth/AnimationPanel";
import SignupForm from "@/components/auth/SignupForm";
import OtpForm from "@/components/auth/OtpForm";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { FaArrowLeft } from "react-icons/fa";

export default function SignupPage() {
  const [otpStep, setOtpStep] = useState(false);
  const [userEmail, setUserEmail] = useState(""); 
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-white dark:from-gray-900 dark:via-gray-950 dark:to-black p-6 relative">
      <div className="absolute top-4 left-4 flex items-center gap-4">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg shadow hover:bg-gray-300 dark:hover:bg-gray-700 transition"
        >
          <FaArrowLeft /> Back
        </button>
      </div>

      <div className="absolute top-4 right-4">
        <ThemeToggleButton
          variant="gif"
          url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif"
        />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl">
        <AnimationPanel />
        {!otpStep ? (
          <SignupForm setOtpStep={setOtpStep} setUserEmail={setUserEmail} />
        ) : (
          <OtpForm email={userEmail} context="signup" />
        )}
      </div>
    </div>
  );
}
