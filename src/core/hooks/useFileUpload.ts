/**
 * useFileUpload — Shared file upload hook supporting multiple buckets.
 */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UploadResult } from "@/core/types";

interface UploadOptions {
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult | null> => {
    const {
      bucket = "media",
      folder = "",
      maxSizeMB = 20,
      allowedTypes,
    } = options;

    // Validation
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Maximum ${maxSizeMB}MB allowed.`);
      return null;
    }
    if (allowedTypes && !allowedTypes.some((t) => file.type.startsWith(t))) {
      toast.error(`File type not allowed. Accepted: ${allowedTypes.join(", ")}`);
      return null;
    }

    setUploading(true);
    setProgress(0);

    const ext = file.name.split(".").pop();
    const path = `${folder ? folder + "/" : ""}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file);

    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setProgress(100);
    setUploading(false);

    return {
      url: data.publicUrl,
      path,
      bucket,
      size: file.size,
      mimeType: file.type,
    };
  }, []);

  const deleteFile = useCallback(async (bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) toast.error("Delete failed: " + error.message);
    return !error;
  }, []);

  return { upload, deleteFile, uploading, progress };
}
