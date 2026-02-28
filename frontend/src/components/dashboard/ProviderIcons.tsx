import { Mail, ShieldCheck, WalletCards } from "lucide-react";

export default function ProviderIcons({ provider }: { provider: string }) {
  const iconClasses = "h-6 w-6 inline-block mr-2";
  switch (provider) {
    case "google":
      return (
        <svg className={iconClasses} viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303..."></path>
        </svg>
      );
    case "github":
      return (
        <svg className={iconClasses} viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12,2A10,10 0 0,0 2,12C2..."
          />
        </svg>
      );
    case "facebook":
    case "discord":
    case "linkedin":
      return <ShieldCheck className={iconClasses} />;
    case "web3":
      return <WalletCards className={iconClasses} />;
    case "email":
      return <Mail className={iconClasses} />;
    default:
      return <ShieldCheck className={iconClasses} />;
  }
}
