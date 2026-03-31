import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { downloadCSV } from "@/lib/csvExport";

interface ExportCSVButtonProps {
  data: Record<string, any>[];
  filename: string;
  label?: string;
}

export default function ExportCSVButton({ data, filename, label }: ExportCSVButtonProps) {
  const { t } = useLanguage();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={!data.length}
      onClick={() => downloadCSV(data, filename)}
      className="gap-1.5"
    >
      <Download className="h-3.5 w-3.5" />
      {label || t("admin.exportCSV")}
    </Button>
  );
}
