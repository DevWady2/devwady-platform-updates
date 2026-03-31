import { Loader2 } from "lucide-react";
import logoDark from "@/assets/logo-dark.svg";

export default function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-background animate-fade-in-up">
      <img
        src={logoDark}
        alt="DevWady"
        className="h-10 dark:invert"
        fetchPriority="high"
      />
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
