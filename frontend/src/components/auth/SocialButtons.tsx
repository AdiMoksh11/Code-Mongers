"use client";

import { FaGoogle, FaGithub, FaFacebook, FaDiscord, FaLinkedin, FaWallet } from "react-icons/fa";

interface SocialButtonsProps {
  onClick: (provider: string) => void;
}

export default function SocialButtons({ onClick }: SocialButtonsProps) {
  const providers = [
    { name: "Google", icon: <FaGoogle /> },
    { name: "GitHub", icon: <FaGithub /> },
    { name: "Discord", icon: <FaDiscord /> },
    { name: "LinkedIn", icon: <FaLinkedin /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {providers.map((p) => (
        <button
          key={p.name}
          type="button"
          aria-label={`Sign up with ${p.name}`}
          onClick={() => onClick(p.name)}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 hover:bg-gradient-to-r hover:from-teal-400 hover:to-cyan-500 hover:text-white transition rounded-lg py-3 active:scale-95 shadow-sm dark:shadow-md"
        >
          {p.icon} <span className="text-sm font-medium">{p.name}</span>
        </button>
      ))}
    </div>
  );
}
