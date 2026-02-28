"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";

interface Props {
  email: string;
  context: "signup" | "login" | "forgot";
  onVerified?: (email: string) => void; 
}

export default function OtpForm({ email, context, onVerified }: Props) {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(
    new Date(Date.now() + 10 * 60 * 1000)
  );
  const [remainingTime, setRemainingTime] = useState<number>(10 * 60);

  // Resend button timer
  useEffect(() => {
    let interval: number;
    if (resendDisabled) {
      interval = window.setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setResendDisabled(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendDisabled]);

  // OTP expiry timer
  useEffect(() => {
    if (!expiresAt) return;

    const interval = window.setInterval(() => {
      const diff = Math.max(
        0,
        Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      );
      setRemainingTime(diff);

      if (diff <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Verify OTP
  const verifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setServerError("Please enter all 6 digits.");
      return;
    }

    if (remainingTime <= 0) {
      setServerError("OTP has expired. Please resend.");
      return;
    }

    try {
      setLoading(true);
      setServerError(null);

      const res = await api.post("/api/auth/verify-otp", {
        email,
        otp: otpCode,
        context,
      });

      if (context === "forgot") {
        if (res.data.resetAllowed && onVerified) {
          localStorage.setItem("resetOtp", otpCode);
          onVerified(email);
        }
      } else {
        localStorage.setItem("authToken", res.data.token);
        
        // Check if user has a role, if not redirect to role selection
        const userRole = res.data.user?.role;
        
        if (!userRole) {
          router.push("/select-role");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setServerError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const val = e.target.value.replace(/\D/, "");
    if (!val && otp[index] === "") return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    setServerError(null);
    setResendMessage(null);

    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    const target = e.target as HTMLInputElement;

    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0 && target.selectionStart === 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (
      e.key === "ArrowRight" &&
      index < 5 &&
      target.selectionStart === target.value.length
    ) {
      otpRefs.current[index + 1]?.focus();
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (otp.join("").length === 6 && remainingTime > 0 && !loading) {
        verifyOtp();
      }
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    setResendDisabled(true);
    setTimer(30);
    setServerError(null);
    setResendMessage(null);

    try {
      await api.post("/api/auth/resend-otp", { email, context }); // <-- added context
      setResendMessage("OTP has been resent to your email.");
      setExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
      setRemainingTime(10 * 60);
    } catch (err: any) {
      console.error("Resend OTP Error:", err);
      console.error("Response Data:", err.response?.data);
      console.error("Response Status:", err.response?.status);
      console.error("Response Headers:", err.response?.headers);

      setServerError(
        err.response?.data?.message || "Failed to resend OTP. Check console for details."
      );
      setResendDisabled(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md p-10 flex flex-col justify-center text-gray-900 dark:text-white rounded-r-2xl">
      <h2 className="text-2xl font-bold text-center mb-4">Verify OTP</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
        Enter the 6-digit OTP sent to <strong>{email}</strong>
      </p>

      {remainingTime > 0 ? (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-4">
          OTP is valid for{" "}
          <span className="font-semibold">{formatTime(remainingTime)}</span>
        </p>
      ) : (
        <p className="text-xs text-center text-red-500 mb-4">
          OTP has expired. Please resend.
        </p>
      )}

      {serverError && (
        <div className="mb-3 p-3 rounded-md bg-red-100 text-red-700 text-sm border border-red-300 text-center">
          {serverError}
        </div>
      )}
      {resendMessage && (
        <div className="mb-3 p-3 rounded-md bg-green-100 text-green-700 text-sm border border-green-300 text-center">
          {resendMessage}
        </div>
      )}

      <form
        className="space-y-4 flex flex-col items-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (otp.join("").length === 6 && remainingTime > 0 && !loading) {
            verifyOtp();
          }
        }}
      >
        <div className="flex gap-3">
          {otp.map((val, i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              value={val}
              onChange={(e) => handleChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              ref={(el) => {
                otpRefs.current[i] = el;
              }}
              className="w-14 h-14 text-center text-2xl rounded-lg border border-gray-300 dark:border-gray-600 focus:border-teal-400 focus:ring-2 focus:ring-cyan-400 bg-gray-100 dark:bg-gray-800 outline-none shadow hover:scale-105 transition active:scale-95"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otp.join("").length !== 6 || remainingTime <= 0}
          className="mt-6 px-6 py-2 rounded-lg bg-teal-500 text-white font-medium hover:bg-cyan-500 transition disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendDisabled}
          className="text-sm text-teal-500 hover:text-cyan-500 mt-4 disabled:opacity-50"
        >
          {resendDisabled
            ? `Resend OTP in ${timer}s`
            : "Didn’t receive? Resend OTP"}
        </button>
      </form>
    </div>
  );
}
