import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { toast } from "sonner";
import { Upload, Image as ImageIcon } from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";

export interface BlogFormData {
  id?: string;
  title: string;
  title_ar: string;
  slug: string;
  excerpt: string;
  excerpt_ar: string;
  content: string;
  content_ar: string;
  cover_image_url: string;
  category: string;
  author_name: string;
  author_avatar_url: string;
  read_time_minutes: number;
  status: string;
}

const empty: BlogFormData = {
  title: "", title_ar: "", slug: "", excerpt: "", excerpt_ar: "",
  content: "", content_ar: "", cover_image_url: "", category: "tech",
  author_name: "", author_avatar_url: "", read_time_minutes: 5, status: "draft",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: BlogFormData | null;
}

export default function BlogPostFormDialog({ open, onClose, onSaved, initial }: Props) {
  const { t } = useLanguage();
  const [form, setForm] = useState<BlogFormData>(initial ?? { ...empty });
  const { upload, uploading } = useMediaUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof BlogFormData, v: any) => setForm(p => ({ ...p, [k]: v }));

  const autoSlug = (title: string) => {
    set("title", title);
    if (!form.id) set("slug", title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await upload(f, "blog");
    if (url) set("cover_image_url", url);
  };

  const handleSave = async () => {
    if (!form.title || !form.slug) { toast.error("Title and slug are required"); return; }
    const payload: any = {
      title: form.title, title_ar: form.title_ar || null, slug: form.slug,
      excerpt: form.excerpt || null, excerpt_ar: form.excerpt_ar || null,
      content: form.content || null, content_ar: form.content_ar || null,
      cover_image_url: form.cover_image_url || null, category: form.category || null,
      author_name: form.author_name || null, author_avatar_url: form.author_avatar_url || null,
      read_time_minutes: form.read_time_minutes || 5, status: form.status,
      published_at: form.status === "published" ? new Date().toISOString() : null,
    };
    const { error } = form.id
      ? await supabase.from("blog_posts").update(payload).eq("id", form.id)
      : await supabase.from("blog_posts").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(form.id ? "Post updated" : "Post created");
    onSaved();
    onClose();
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) { setForm(initial ?? { ...empty }); onClose(); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit Blog Post" : "New Blog Post"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {/* Title EN */}
          <div className="grid gap-1.5">
            <Label>{t("form.titleEn")} *</Label>
            <Input value={form.title} onChange={e => autoSlug(e.target.value)} />
          </div>
          {/* Title AR */}
          <div className="grid gap-1.5">
            <Label>{t("form.titleAr")}</Label>
            <Input dir="rtl" value={form.title_ar} onChange={e => set("title_ar", e.target.value)} />
          </div>
          {/* Slug */}
          <div className="grid gap-1.5">
            <Label>{t("form.slug")} *</Label>
            <Input value={form.slug} onChange={e => set("slug", e.target.value)} />
          </div>
          {/* Row: Category, Author, Read time */}
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>{t("form.category")}</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="culture">Culture</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Author</Label>
              <Input value={form.author_name} onChange={e => set("author_name", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Read Time (min)</Label>
              <Input type="number" value={form.read_time_minutes} onChange={e => set("read_time_minutes", +e.target.value)} />
            </div>
          </div>
          {/* Cover Image */}
          <div className="grid gap-1.5">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-3">
              {form.cover_image_url ? (
                <img loading="lazy" src={form.cover_image_url} alt="" className="h-20 w-32 object-cover rounded-md border" />
              ) : (
                <div className="h-20 w-32 rounded-md border border-dashed flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="h-4 w-4 me-1" /> {uploading ? "Uploading…" : "Upload"}
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </div>
          </div>
          {/* Excerpt EN */}
          <div className="grid gap-1.5">
            <Label>Excerpt (EN)</Label>
            <Textarea rows={2} value={form.excerpt} onChange={e => set("excerpt", e.target.value)} />
          </div>
          {/* Excerpt AR */}
          <div className="grid gap-1.5">
            <Label>Excerpt (AR)</Label>
            <Textarea rows={2} dir="rtl" value={form.excerpt_ar} onChange={e => set("excerpt_ar", e.target.value)} />
          </div>
          {/* Content EN — Markdown Editor */}
          <div className="grid gap-1.5">
            <Label>Content (EN)</Label>
            <MarkdownEditor value={form.content} onChange={v => set("content", v)} placeholder="Write your blog post content…" />
          </div>
          {/* Content AR — Markdown Editor */}
          <div className="grid gap-1.5">
            <Label>Content (AR)</Label>
            <MarkdownEditor value={form.content_ar} onChange={v => set("content_ar", v)} dir="rtl" placeholder="اكتب محتوى المقال…" />
          </div>
          {/* Status */}
          <div className="flex items-center gap-3">
            <Label>Published</Label>
            <Switch checked={form.status === "published"} onCheckedChange={c => set("status", c ? "published" : "draft")} />
            <span className="text-xs text-muted-foreground">{form.status}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={handleSave} disabled={uploading}>{form.id ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
