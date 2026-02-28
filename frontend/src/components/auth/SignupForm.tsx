"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SocialButtons from "./SocialButtons";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "@/utils/axios";
import { ethers } from "ethers";
import toast from "react-hot-toast";

interface Props {
  setOtpStep: (value: boolean) => void;
  setUserEmail: (email: string) => void;
}

export default function SignupForm({ setOtpStep, setUserEmail }: Props) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [errors, setErrors] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "password") {
      setErrors({ ...errors, password: "" });
    } else {
      setErrors({ ...errors, [e.target.name]: false });
    }
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors = {
      firstName: form.firstName.trim() === "",
      lastName: form.lastName.trim() === "",
      email: form.email.trim() === "",
      password: "",
    };

    if (form.password.trim() === "") {
      newErrors.password = "Please fill this field";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);

    if (
      newErrors.firstName ||
      newErrors.lastName ||
      newErrors.email ||
      newErrors.password !== ""
    ) {
      return;
    }

    try {
      setLoading(true);
      setServerError(null);
      await api.post("/api/auth/register", form);
      setUserEmail(form.email);
      setOtpStep(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    switch (provider) {
      case "Google":
        window.location.href = `${baseUrl}/api/auth/google?mode=signup`;
        break;
      case "GitHub":
        window.location.href = `${baseUrl}/api/auth/github?mode=signup`;
        break;
      case "Discord":
        window.location.href = `${baseUrl}/api/auth/discord?mode=signup`;
        break;
      case "LinkedIn":
        window.location.href = `${baseUrl}/api/auth/linkedin?mode=signup`;
        break;
      default:
        console.log(`${provider} login not implemented yet.`);
    }
  };

  const inputBaseClasses =
    "w-full px-4 py-3 rounded-lg border focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 outline-none placeholder-gray-400 dark:placeholder-gray-500 transition";

  return (
    <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md p-10 flex flex-col justify-center text-gray-900 dark:text-white rounded-r-2xl">
      <h2 className="text-2xl font-bold text-center mb-2">Sign Up for Credexa</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
        Join Credexa to access secure, verified, and modern learning experiences.
      </p>

      <SocialButtons onClick={handleSocialLogin} />

      <div className="flex items-center gap-4 mb-6">
        <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1" />
        <span className="text-xs text-gray-500 dark:text-gray-400">or sign up with email</span>
        <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1" />
      </div>

      {serverError && (
        <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 text-sm border border-red-300">
          {serverError}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <input
              type="text"
              name="firstName"
              placeholder="First name"
              value={form.firstName}
              onChange={handleChange}
              className={`${inputBaseClasses} ${
                errors.firstName ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">Please fill this field</p>
            )}
          </div>
          <div>
            <input
              type="text"
              name="lastName"
              placeholder="Last name"
              value={form.lastName}
              onChange={handleChange}
              className={`${inputBaseClasses} ${
                errors.lastName ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">Please fill this field</p>
            )}
          </div>
        </div>

        <div>
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            className={`${inputBaseClasses} ${
              errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            }`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">Please fill this field</p>}
        </div>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className={`${inputBaseClasses} ${
              errors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            }`}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-cyan-500 hover:to-teal-400 rounded-lg transition font-medium active:scale-95 text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          Already registered?{" "}
          <Link href="/login" className="text-indigo-500 dark:text-indigo-400 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
