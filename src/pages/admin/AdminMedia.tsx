import SEO from "@/components/SEO";
import { useEffect, useState, useRef, useCallback } from "react";
import { EmptyState } from "@/components/admin/EmptyState";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Trash2, Copy, Search, Camera, FileText, Film, Grid, List, ExternalLink, Plus, Pencil, Play, Mic } from "lucide-react";
import { toast } from "sonner";
import MediaItemFormDialog from "@/components/admin/MediaItemFormDialog";

interface MediaFile { name: string; id: string; created_at: string; metadata: { size?: number; mimetype?: string } | null; }

const fileTypeIcon = (name: string) => { if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)) return Camera; if (/\.(mp4|mov|avi|webm)$/i.test(name)) return Film; return FileText; };
const formatFileSize = (bytes?: number) => { if (!bytes) return "—"; if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; };
const typeIcons: Record<string, typeof Play> = { video: Play, reel: Film, podcast: Mic };

export default function AdminMedia() {
  const { t, lang } = useLanguage();
  const qc = useQueryClient();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchFiles = async () => {
    const { data, error } = await supabase.storage.from("media").list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    if (!error && data) setFiles(data.filter((f) => f.name !== ".emptyFolderPlaceholder") as any);
    setLoadingFiles(false);
  };
  useEffect(() => { fetchFiles(); }, []);

  const { data: mediaItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ["admin-media-items"],
    queryFn: async () => { const { data, error } = await supabase.from("media_items").select("*").order("sort_order"); if (error) throw error; return data; } });

  const saveMutation = useMutation({
    mutationFn: async (form: any) => { if (editingItem) { const { error } = await supabase.from("media_items").update(form).eq("id", editingItem.id); if (error) throw error; } else { const { error } = await supabase.from("media_items").insert(form); if (error) throw error; } },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-media-items"] }); setDialogOpen(false); setEditingItem(null); toast.success(t("admin.save")); },
    onError: (e: any) => toast.error(e.message) });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("media_items").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-media-items"] }); toast.success(t("admin.delete")); },
    onError: (e: any) => toast.error(e.message) });

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "item" | "file" } | null>(null);
  const confirmDelete = () => { if (!deleteTarget) return; if (deleteTarget.type === "item") deleteMutation.mutate(deleteTarget.id); else handleDeleteFile(deleteTarget.id); setDeleteTarget(null); };

  const uploadFile = async (file: File) => {
    setUploading(true);
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage.from("media").upload(fileName, file);
    if (error) toast.error(`Upload failed: ${file.name}`); else toast.success(`Uploaded ${file.name}`);
    setUploading(false); fetchFiles();
  };
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const fl = e.target.files; if (!fl) return; for (const file of Array.from(fl)) await uploadFile(file); if (inputRef.current) inputRef.current.value = ""; };
  const handleDrop = useCallback(async (e: React.DragEvent) => { e.preventDefault(); setDragging(false); for (const file of Array.from(e.dataTransfer.files)) await uploadFile(file); }, []);
  const handleDeleteFile = async (name: string) => { const { error } = await supabase.storage.from("media").remove([name]); if (error) { toast.error(t("admin.delete")); return; } toast.success(t("admin.delete")); if (preview?.name === name) setPreview(null); fetchFiles(); };
  const getPublicUrl = (name: string) => supabase.storage.from("media").getPublicUrl(name).data.publicUrl;
  const copyUrl = (name: string) => { navigator.clipboard.writeText(getPublicUrl(name)); toast.success(t("admin.copyUrl")); };
  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
  const filtered = files.filter((f) => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">{t("admin.mediaManagement")}</h1><p className="text-muted-foreground text-sm">{t("admin.manageMedia")}</p></div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content" className="gap-1.5"><Play className="h-4 w-4" /> {t("admin.content")} ({mediaItems.length})</TabsTrigger>
          <TabsTrigger value="files" className="gap-1.5"><Camera className="h-4 w-4" /> {t("admin.fileStorage")} ({files.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => { setEditingItem(null); setDialogOpen(true); }} className="gradient-brand text-primary-foreground"><Plus className="h-4 w-4 me-1" /> {t("admin.addMediaItem")}</Button></div>
          {loadingItems ? <p className="text-muted-foreground">{t("admin.loading")}</p> : (
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>{t("admin.title")}</TableHead><TableHead>{t("admin.type")}</TableHead><TableHead>{t("admin.category")}</TableHead><TableHead>{t("admin.duration")}</TableHead><TableHead>{t("admin.status")}</TableHead><TableHead className="w-24">{t("admin.actions")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {mediaItems.map((item: any) => { const Icon = typeIcons[item.type] || Play; return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" />{item.title_en}</div></TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs capitalize">{item.type}</Badge></TableCell>
                    <TableCell className="capitalize">{item.category}</TableCell><TableCell>{item.duration || "—"}</TableCell>
                    <TableCell><Badge variant={item.is_active ? "default" : "outline"}>{item.is_active ? t("admin.active") : t("admin.inactive")}</Badge></TableCell>
                    <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => { setEditingItem(item); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget({ id: item.id, type: "item" })}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>
                ); })}
                {mediaItems.length === 0 && <TableRow><TableCell colSpan={6}><EmptyState icon={Film} title={lang === "ar" ? "لا توجد وسائط" : "No media items"} description={lang === "ar" ? "أضف مقاطع فيديو أو بودكاست" : "Add videos, podcasts, or articles"} actionLabel={lang === "ar" ? "إضافة وسائط" : "Add Media"} onAction={() => { setEditingItem(null); setDialogOpen(true); }} /></TableCell></TableRow>}
              </TableBody>
            </Table></div>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 w-full"><Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t("admin.searchFiles")} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ps-9" /></div>
            <div className="flex gap-2">
              <div className="flex gap-1 bg-muted rounded-lg p-1"><Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("grid")}><Grid className="h-4 w-4" /></Button><Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button></div>
              <input ref={inputRef} type="file" multiple className="hidden" onChange={handleUpload} />
              <Button className="gradient-brand text-primary-foreground" onClick={() => inputRef.current?.click()} disabled={uploading}><Upload className="h-4 w-4 me-2" /> {uploading ? t("admin.uploading") : t("admin.upload")}</Button>
            </div>
          </div>
          <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} className={`relative rounded-xl border-2 border-dashed transition-colors min-h-[300px] ${dragging ? "border-primary bg-primary/5" : "border-transparent"}`}>
            {dragging && <div className="absolute inset-0 flex items-center justify-center bg-primary/5 rounded-xl z-10"><div className="text-center"><Upload className="h-10 w-10 mx-auto mb-2 text-primary" /><p className="text-sm font-medium text-primary">{t("admin.dropFiles")}</p></div></div>}
            {loadingFiles ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground"><Camera className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="font-medium">{searchQuery ? t("admin.noFilesFound") : t("admin.noFilesYet")}</p></div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filtered.map(file => { const Icon = fileTypeIcon(file.name); return (
                  <div key={file.id} className="bg-card rounded-xl border border-border overflow-hidden group hover:border-primary/30 transition-all cursor-pointer" onClick={() => setPreview(file)}>
                    <div className="aspect-square bg-muted/50 flex items-center justify-center overflow-hidden">{isImage(file.name) ? <img loading="lazy" src={getPublicUrl(file.name)} alt={file.name} className="w-full h-full object-cover" /> : <Icon className="h-8 w-8 text-muted-foreground/50" />}</div>
                    <div className="p-2"><p className="text-[10px] text-muted-foreground truncate">{file.name}</p><p className="text-[9px] text-muted-foreground/60">{formatFileSize(file.metadata?.size)}</p></div>
                  </div>
                ); })}
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead><tr className="border-b border-border bg-muted/50"><th className="text-start p-3 text-xs font-medium text-muted-foreground">{t("admin.file")}</th><th className="text-start p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">{t("admin.type")}</th><th className="text-start p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">{t("admin.size")}</th><th className="text-end p-3 text-xs font-medium text-muted-foreground">{t("admin.actions")}</th></tr></thead>
                  <tbody>
                    {filtered.map(file => { const Icon = fileTypeIcon(file.name); return (
    <>
    <SEO title="Media — Admin" noIndex />
                      <tr key={file.id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setPreview(file)}>
                        <td className="p-3 text-sm"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground shrink-0" /><span className="truncate max-w-[200px]">{file.name}</span></div></td>
                        <td className="p-3 text-xs text-muted-foreground hidden sm:table-cell"><Badge variant="outline" className="text-[10px]">{file.name.split(".").pop()?.toUpperCase()}</Badge></td>
                        <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">{formatFileSize(file.metadata?.size)}</td>
                        <td className="p-3 text-end" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyUrl(file.name)}><Copy className="h-3 w-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ id: file.name, type: "file" })}><Trash2 className="h-3 w-3" /></Button></div>
                        </td>
                      </tr>
    </>
                    ); })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="text-sm truncate">{preview?.name}</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-4">
              {isImage(preview.name) ? <div className="rounded-lg overflow-hidden bg-muted/50 border border-border"><img loading="lazy" src={getPublicUrl(preview.name)} alt={preview.name} className="w-full max-h-[400px] object-contain" /></div> : <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg">{(() => { const Icon = fileTypeIcon(preview.name); return <Icon className="h-12 w-12 text-muted-foreground/40" />; })()}</div>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">{t("admin.size")}</span><p className="font-medium">{formatFileSize(preview.metadata?.size)}</p></div>
                <div><span className="text-muted-foreground text-xs">{t("admin.uploaded")}</span><p className="font-medium">{new Date(preview.created_at).toLocaleDateString()}</p></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => copyUrl(preview.name)}><Copy className="h-3.5 w-3.5 me-1.5" /> {t("admin.copyUrl")}</Button>
                <Button variant="outline" size="sm" className="flex-1" asChild><a href={getPublicUrl(preview.name)} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 me-1.5" /> {t("admin.open")}</a></Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteTarget({ id: preview.name, type: "file" })}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <MediaItemFormDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editingItem} onSave={data => saveMutation.mutate(data)} />
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={confirmDelete} />
    </div>
  );
}
