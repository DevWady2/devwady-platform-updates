import { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  className?: string;
  align?: "center" | "start";
  children?: ReactNode;
}

export function SectionHeader({ eyebrow, title, subtitle, className = "", align = "center", children }: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center items-center" : "text-start items-start";

  return (
    <div className={`flex flex-col ${alignClass} mb-14 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider mb-2 text-primary">
        {eyebrow}
      </span>
      <div className="w-16 h-1 gradient-accent rounded-full mb-4" />
      <h2 className="heading-section mb-3">{title}</h2>
      {subtitle && (
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">{subtitle}</p>
      )}
      {children}
    </div>
  );
}
