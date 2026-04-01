/**
 * MediaManager — Shared file/media upload & management UI.
 */
import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFileUpload } from "@/core/hooks/useFileUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload, Image, FileText, Film, Music, File,
  Copy, Check, Loader2, FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import type { UploadResult } from "@/core/types";

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  return File;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

interface Props {
  bucket?: string;
  folder?: string;
  allowedTypes?: string[];
  maxFiles?: number;
  onSelect?: (url: string) => void;
  compact?: boolean;
}

export default function MediaManager({
  bucket = "media",
  folder = "",
  allowedTypes,
  maxFiles = 10,
  onSelect,
  compact = false,
}: Props) {
  const { lang } = useLanguage();
  const { upload, uploading } = useFileUpload();
  const [files, setFiles] = useState<UploadResult[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAr = lang === "ar";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const remaining = maxFiles - files.length;
    const toUpload = Array.from(fileList).slice(0, remaining);

    for (const file of toUpload) {
      const result = await upload(file, { bucket, folder, allowedTypes });
      if (result) {
        setFiles((prev) => [...prev, result]);
        onSelect?.(result.url);
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success(isAr ? "تم نسخ الرابط" : "URL copied");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const content = (
    <>
      {/* Upload area */}
      <div
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <Input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept={allowedTypes?.join(",") ?? undefined}
          onChange={handleUpload}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{isAr ? "جاري الرفع..." : "Uploading..."}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {isAr ? "انقر أو اسحب ملفات للرفع" : "Click or drag files to upload"}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {isAr ? `حد أقصى ${maxFiles} ملفات` : `Max ${maxFiles} files`}
            </p>
          </div>
        )}
      </div>

      {/* Uploaded files */}
      {files.length > 0 && (
        <ScrollArea className="max-h-[300px] mt-4">
          <div className="space-y-2">
            {files.map((file, i) => {
              const Icon = getFileIcon(file.mimeType);
              return (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                  {file.mimeType.startsWith("image/") ? (
                    <img src={file.url} alt="" className="h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{file.path.split("/").pop()}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyUrl(file.url)}
                    >
                      {copiedUrl === file.url ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    {onSelect && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onSelect(file.url)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </>
  );

  if (compact) return <div>{content}</div>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          {isAr ? "مدير الملفات" : "File Manager"}
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
