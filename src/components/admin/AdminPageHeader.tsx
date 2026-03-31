import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  };
  children?: ReactNode;
}

export default function AdminPageHeader({ title, subtitle, icon: Icon, action, children }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="h-10 w-10 rounded-2xl admin-gradient-header flex items-center justify-center shadow-lg">
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
        <div>
          <h1 className="admin-page-title">{title}</h1>
          {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
        {action && (
          <Button onClick={action.onClick} className="admin-gradient-header text-white border-0 shadow-md hover:shadow-lg transition-shadow rounded-xl">
            {action.icon && <action.icon className="h-4 w-4 me-2" />}
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
