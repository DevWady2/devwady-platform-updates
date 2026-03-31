import { useProfileCompleteness } from "@/hooks/useProfileCompleteness";
import { Check } from "lucide-react";

interface Props {
  size?: number;
}

export default function ProfileCompletenessRing({ size = 40 }: Props) {
  const { percentage, loading } = useProfileCompleteness();

  if (loading) return null;

  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  if (percentage >= 100) {
    return (
      <div
        className="rounded-full bg-green-500/15 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Check className="h-4 w-4 text-green-600" />
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary">
        {percentage}
      </span>
    </div>
  );
}
