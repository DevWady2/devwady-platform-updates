import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface AddRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** @deprecated Compatibility-only prop; the dialog is informational only. */
  targetAccountType?: string;
  /** @deprecated Compatibility-only callback; never invoked. */
  onSuccess?: () => void;
}

/**
 * AddRoleDialog is disabled in the single-account model.
 * It remains as a safe compatibility surface and only shows an informational message.
 */
export default function AddRoleDialog({ open, onOpenChange }: AddRoleDialogProps) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            {isAr ? "غير متاح حالياً" : "Not Available"}
          </DialogTitle>
          <DialogDescription>
            {isAr
              ? "إضافة نوع حساب آخر غير متاحة حالياً. حسابك يعمل بنوع حساب واحد."
              : "Adding another account type is not currently available. Your account operates with a single account type."}
          </DialogDescription>
        </DialogHeader>
        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
          {isAr ? "حسناً" : "OK"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
