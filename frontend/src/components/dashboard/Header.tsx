"use client";

import { Wallet } from "lucide-react";
import ThemeToggleButton from "../ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Cover } from "@/components/ui/cover";

interface HeaderProps {
  user: any;
  onConnectWallet: () => void;
}

export default function Header({ user, onConnectWallet }: HeaderProps) {
  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Helper to get proper display name from user.fullName.firstName
  const getDisplayName = () => {
    // Safely extract firstName from the nested structure
    if (!user || !user.fullName || !user.fullName.firstName) {
      return "User";
    }
    
    const firstName = user.fullName.firstName;
    
    // Handle test data - if firstName is "Safe", display as "Safeer"
    if (firstName.toLowerCase() === "safe") {
      return "Safeer";
    }
    
    return firstName;
  };

  const walletConnected = user?.walletAddress;

  return (
    <header className="flex justify-between items-center mb-10">
      <div>
               <h1 className="text-3xl font-bold">
                Welcome back, <Cover>{getDisplayName()}</Cover>
               </h1>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <ThemeToggleButton
          variant="gif"
          url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif"
        />

        <img
          src={user?.profilePic || `https://avatar.vercel.sh/${user?._id}.png`}
          alt="Profile"
          className="w-10 h-10 rounded-full border"
        />

        {walletConnected ? (
          <span className="px-4 py-1.5 rounded-full border font-medium">
            {formatAddress(walletConnected)}
          </span>
        ) : (
          <button
            onClick={onConnectWallet}
            className="flex items-center gap-2 relative overflow-hidden px-4 py-1.5 sm:px-6 sm:py-2 font-semibold border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-full z-10 group transition-all duration-300 text-sm sm:text-base"
          >
            <Wallet className="h-4 w-4 relative z-20 transition-colors duration-300 group-hover:text-black" />
            <span className="relative z-20 group-hover:text-white transition-all duration-300">
              Wallet
            </span>
            <span className="absolute inset-0 flex justify-center items-center z-0">
              <span className="h-10 w-10 sm:h-12 sm:w-12 bg-emerald-500 rounded-full scale-0 group-hover:scale-[2.5] transition-transform duration-500 ease-out"></span>
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
