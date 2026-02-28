import React, { ReactNode } from "react";
import { SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BadgeButtonProps {
  children: ReactNode;
}

const BadgeButton: React.FC<BadgeButtonProps> = ({ children }) => {
  return (
    <Badge
      variant="outline"
      className="mb-3 cursor-pointer rounded-[14px] border border-black/10 bg-white text-base dark:bg-gray-900 dark:border-white/20 dark:text-white md:left-6 flex items-center"
    >
      <SparklesIcon className="mr-2 text-pink-400 dark:text-pink-300" />
      {children}
    </Badge>
  );
};

export default BadgeButton;
