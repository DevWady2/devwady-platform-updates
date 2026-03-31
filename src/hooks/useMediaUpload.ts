import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File, folder = ""): Promise<string | null> => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${folder ? folder + "/" : ""}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(fileName, file);
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return null;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(fileName);
    setUploading(false);
    return data.publicUrl;
  };

  return { upload, uploading };
}
