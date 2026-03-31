import SEO from "@/components/SEO";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/admin/EmptyState";
import ConfirmDeleteDialog from "@/components/admin/ConfirmDeleteDialog";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import PaginationControls from "@/components/PaginationControls";
import ExportCSVButton from "@/components/admin/ExportCSVButton";
import BlogPostFormDialog, { BlogFormData } from "@/components/admin/BlogPostFormDialog";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminTableCard, AdminTableHead, AdminTh, AdminTd, AdminTr, AdminStatusBadge } from "@/components/admin/AdminTableCard";

interface BlogPost {
  id: string; title: string; title_ar: string | null; slug: string; status: string;
  category: string | null; author_name: string | null; author_avatar_url: string | null;
  excerpt: string | null; excerpt_ar: string | null; content: string | null; content_ar: string | null;
  cover_image_url: string | null; read_time_minutes: number | null; created_at: string;
}

export default function AdminBlog() {
  const { t, lang } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlogFormData | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const totalPages = Math.ceil(posts.length / PAGE_SIZE);
  const paginatedPosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchPosts = async () => {
    const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    if (!error && data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("blog_posts").delete().eq("id", deleteTarget);
    if (error) { toast.error(error.message); setDeleting(false); return; }
    toast.success(t("admin.delete"));
    fetchPosts();
    setDeleting(false);
    setDeleteTarget(null);
  };

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (p: BlogPost) => {
    setEditing({
      id: p.id, title: p.title, title_ar: p.title_ar || "", slug: p.slug,
      excerpt: p.excerpt || "", excerpt_ar: p.excerpt_ar || "",
      content: p.content || "", content_ar: p.content_ar || "",
      cover_image_url: p.cover_image_url || "", category: p.category || "tech",
      author_name: p.author_name || "", author_avatar_url: p.author_avatar_url || "",
      read_time_minutes: p.read_time_minutes || 5, status: p.status });
    setDialogOpen(true);
  };

  return (
    <>
    <SEO title="Blog — Admin" noIndex />
    <div>
      <AdminPageHeader title={t("admin.blogPosts")} subtitle={t("admin.manageContent")} icon={FileText} action={{ label: t("admin.newPost"), icon: Plus, onClick: openCreate }}>
        <ExportCSVButton data={posts.map(p => ({ title: p.title, slug: p.slug, category: p.category, status: p.status, author_name: p.author_name, read_time_minutes: p.read_time_minutes, created_at: p.created_at }))} filename="blog-posts" />
      </AdminPageHeader>
      <AdminTableCard>
        <table className="w-full">
          <AdminTableHead>
            <AdminTh>{t("admin.title")}</AdminTh>
            <AdminTh className="hidden md:table-cell">{t("admin.category")}</AdminTh>
            <AdminTh className="hidden sm:table-cell">{t("admin.status")}</AdminTh>
            <AdminTh className="hidden lg:table-cell">{t("admin.date")}</AdminTh>
            <AdminTh className="text-end">{t("admin.actions")}</AdminTh>
          </AdminTableHead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50"><td colSpan={5} className="p-4"><div className="h-6 bg-muted rounded-lg animate-pulse" /></td></tr>
              ))
            ) : paginatedPosts.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon={FileText} title={lang === "ar" ? "لا توجد مقالات بعد" : "No blog posts yet"} description={lang === "ar" ? "أنشئ أول مقال لك" : "Create your first blog post to get started"} actionLabel={lang === "ar" ? "إضافة مقال" : "Create Post"} onAction={() => { setEditing(null); setDialogOpen(true); }} /></td></tr>
            ) : (
              paginatedPosts.map((post) => (
                <AdminTr key={post.id}>
                  <AdminTd className="font-medium">{post.title}</AdminTd>
                  <AdminTd className="text-muted-foreground hidden md:table-cell">{post.category || "—"}</AdminTd>
                  <AdminTd className="hidden sm:table-cell"><AdminStatusBadge status={post.status} variant={post.status === "published" ? "success" : "warning"} /></AdminTd>
                  <AdminTd className="text-muted-foreground hidden lg:table-cell">{new Date(post.created_at).toLocaleDateString()}</AdminTd>
                  <AdminTd className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => window.open(`/blog/${post.slug}`, "_blank")}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(post)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => setDeleteTarget(post.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </AdminTd>
                </AdminTr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableCard>
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
      <BlogPostFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={fetchPosts} initial={editing} />
      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={confirmDelete} loading={deleting} />
    </div>
    </>
  );
}
