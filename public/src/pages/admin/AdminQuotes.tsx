import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Receipt, Search, Copy, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import PaginationControls from "@/components/PaginationControls";
import ExportCSVButton from "@/components/admin/ExportCSVButton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SEO from "@/components/SEO";
import { format } from "date-fns";

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", color: "bg-blue-500/15 text-blue-600" },
  viewed: { label: "Viewed", color: "bg-amber-500/15 text-amber-600" },
  approved: { label: "Approved", color: "bg-emerald-500/15 text-emerald-600" },
  rejected: { label: "Rejected", color: "bg-red-500/15 text-red-600" },
  expired: { label: "Expired", color: "bg-gray-500/15 text-gray-600" },
  revised: { label: "Revised", color: "bg-purple-500/15 text-purple-600" },
};

const PER_PAGE = 15;

export default function AdminQuotes() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: quotes = [] } = useQuery({
    queryKey: ["admin-quotes"],
    queryFn: async () => {
      const { data } = await supabase.from("quotes").select("*, service_requests(contact_name, contact_email)").order("created_at", { ascending: false });
      return data || [];
    },
    staleTime: 60000,
  });

  const filtered = quotes.filter((q: any) => {
    if (tab !== "all" && q.status !== tab) return false;
    if (search) {
      const s = search.toLowerCase();
      return (q.quote_number || "").toLowerCase().includes(s) || q.title.toLowerCase().includes(s) || (q.service_requests?.contact_name || "").toLowerCase().includes(s);
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const tabCounts = quotes.reduce((acc: any, q: any) => { acc[q.status] = (acc[q.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  const handleDuplicate = async (q: any) => {
    const { id, quote_number, sent_at, viewed_at, responded_at, created_at, updated_at, service_requests, ...rest } = q;
    const { error } = await supabase.from("quotes").insert({ ...rest, status: "draft" });
    if (error) { toast.error(error.message); return; }
    toast.success("Quote duplicated as draft");
  };

  const csvData = filtered.map((q: any) => ({
    "Quote #": q.quote_number || "",
    Title: q.title,
    Client: q.service_requests?.contact_name || "",
    Total: q.total_usd,
    Status: q.status,
    "Sent At": q.sent_at ? format(new Date(q.sent_at), "PPP") : "",
  }));

  return (
    <div className="p-6 space-y-6">
      <SEO title="Quotes" />
      <AdminPageHeader title={lang === "ar" ? "عروض الأسعار" : "Quotes"} icon={Receipt} subtitle={`${quotes.length} ${lang === "ar" ? "إجمالي" : "total"}`} />

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="all">All ({quotes.length})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({tabCounts.draft || 0})</TabsTrigger>
            <TabsTrigger value="sent">Sent ({tabCounts.sent || 0})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({tabCounts.approved || 0})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({tabCounts.rejected || 0})</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={lang === "ar" ? "بحث..." : "Search..."} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="ps-9 w-56" />
            </div>
            <ExportCSVButton data={csvData} filename="quotes" />
          </div>
        </div>

        <TabsContent value={tab} className="mt-4">
          <div className="rounded-xl border overflow-hidden bg-card">
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang === "ar" ? "رقم" : "Quote #"}</TableHead>
                  <TableHead>{lang === "ar" ? "العنوان" : "Title"}</TableHead>
                  <TableHead>{lang === "ar" ? "العميل" : "Client"}</TableHead>
                  <TableHead className="text-end">{lang === "ar" ? "الإجمالي" : "Total"}</TableHead>
                  <TableHead>{lang === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{lang === "ar" ? "تاريخ الإرسال" : "Sent"}</TableHead>
                  <TableHead className="text-end">{lang === "ar" ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((q: any) => {
                  const sc = STATUS_CONFIG[q.status] || STATUS_CONFIG.draft;
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono text-xs">{q.quote_number || "—"}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{q.title}</TableCell>
                      <TableCell className="text-sm">{q.service_requests?.contact_name || "—"}</TableCell>
                      <TableCell className="text-end font-semibold">{fmt.format(q.total_usd)}</TableCell>
                      <TableCell><Badge variant="outline" className={sc.color}>{sc.label}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{q.sent_at ? format(new Date(q.sent_at), "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/quotes/${q.id}/edit`)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(q)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paged.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">{lang === "ar" ? "لا توجد عروض أسعار" : "No quotes found"}</TableCell></TableRow>
                )}
              </TableBody>
            </Table></div>
          </div>
          {totalPages > 1 && <div className="mt-4"><PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} /></div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
