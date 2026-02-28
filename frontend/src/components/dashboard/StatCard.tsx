import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  linkText: string;
  linkHref?: string;
}

export default function StatCard({ icon, title, description, linkText, linkHref = "#" }: StatCardProps) {
  return (
    <div className="p-6 rounded-2xl shadow-lg border border-emerald-100 dark:border-emerald-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      {icon}
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {description}{" "}
        <Link href={linkHref} className="text-emerald-500 hover:underline">
          {linkText} <ExternalLink className="inline h-3 w-3" />
        </Link>
      </p>
    </div>
  );
}
