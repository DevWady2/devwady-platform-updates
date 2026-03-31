import SEO from "@/components/SEO";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FileInput, Search, Globe, Smartphone, Server, Palette, ShieldCheck,
  Wrench, Users, Lightbulb, MoreHorizontal, AlertTriangle, Eye, ChevronDown,
  Clock, CheckCircle2, MessageSquare, DollarSign, FileText, Tag, UsersRound
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import PaginationControls from "@/components/PaginationControls";
import ExportCSVButton from "@/components/admin/ExportCSVButton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

const SERVICE_TYPE_ICONS: Record<string, React.ElementType> = {
  mobile_app: Smartphone, website: Globe, enterprise_system: Server,
  uiux_design: Palette, qa_testing: ShieldCheck, it_services: Wrench,
  team_augmentation: Users, dedicated_squad: UsersRound, consulting: Lightbulb,
  other: MoreHorizontal, other_project: MoreHorizontal,
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  mobile_app: "Mobile App", website: "Website", enterprise_system: "Enterprise",
  uiux_design: "UI/UX Design", qa_testing: "QA & Testing", it_services: "IT Services",
  team_augmentation: "Team Aug.", dedicated_squad: "Dedicated Squad",
  consulting: "Consulting", other: "Other", other_project: "Other",
};

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string }> = {
  new: { label: "New", labelAr: "جديد", color: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  reviewing: { label: "Reviewing", labelAr: "قيد المراجعة", color: "bg-amber-500/15 text-amber-600 border-amber-500/20" },
  quoted: { label: "Quoted", labelAr: "تم التسعير", color: "bg-purple-500/15 text-purple-600 border-purple-500/20" },
  approved: { label: "Approved", labelAr: "موافق عليه", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" },
  in_progress: { label: "In Progress", labelAr: "قيد التنفيذ", color: "bg-primary/15 text-primary border-primary/20" },
  completed: { label: "Completed", labelAr: "مكتمل", color: "bg-green-500/15 text-green-600 border-green-500/20" },
  closed: { label: "Closed", labelAr: "مغلق", color: "bg-muted text-muted-foreground border-border" },
  rejected: { label: "Rejected", labelAr: "مرفوض", color: "bg-red-500/15 text-red-600 border-red-500/20" },
  on_hold: { label: "On Hold", labelAr: "معلق", color: "bg-gray-500/15 text-gray-600 border-gray-500/20" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  normal: { label: "Normal", color: "bg-muted text-muted-foreground" },
  high: { label: "High", color: "bg-amber-500/15 text-amber-600" },
  urgent: { label: "Urgent", color: "bg-red-500/15 text-red-600 animate-pulse" },
};

const BUDGET_LABELS: Record<string, string> = {
  under_5k: "< $5K", "5k_15k": "$5K–$15K", "15k_50k": "$15K–$50K",
  "50k_100k": "$50K–$100K", "100k_plus": "$100K+", not_sure: "TBD",
};

const PROJECT_TYPES = ["mobile_app", "website", "enterprise_system", "uiux_design", "other", "other_project"];
const SERVICE_TYPES = ["team_augmentation", "qa_testing", "it_services", "dedicated_squad"];

const PAGE_SIZE = 15;

type ServiceRequest = {
  id: string; user_id: string | null; contact_name: string; contact_email: string;
  contact_phone: string | null; company_name: string | null; service_type: string;
  title: string; description: string; requirements: string | null; budget_range: string | null;
  timeline: string | null; preferred_start_date: string | null; attachments: string[] | null;
  status: string; priority: string | null; assigned_to: string | null;
  admin_notes: string | null; internal_estimate_usd: number | null;
  source: string | null; created_at: string; updated_at: string;
  category: string | null; metadata: Record<string, any> | null;
};

type Quote = {
  id: string; service_request_id: string; quote_number: string | null; title: string; status: string;
  total_usd: number; subtotal_usd: number; discount_pct: number | null;
  tax_pct: number | null; line_items: any; valid_until: string | null;
  sent_at: string | null; viewed_at: string | null; responded_at: string | null;
  payment_terms: string | null; estimated_duration: string | null;
  created_at: string;
};

// --- Metadata display helpers ---
function MetadataDisplay({ metadata, serviceType, isAr }: { metadata: Record<string, any> | null; serviceType: string; isAr: boolean }) {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  const items: { label: string; value: React.ReactNode }[] = [];

  if (serviceType === "mobile_app") {
    if (metadata.platforms) items.push({ label: isAr ? "المنصات" : "Platforms", value: <div className="flex gap-1 flex-wrap">{(Array.isArray(metadata.platforms) ? metadata.platforms : [metadata.platforms]).map((p: string) => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}</div> });
    if (metadata.user_types) items.push({ label: isAr ? "أنواع المستخدمين" : "User Types", value: metadata.user_types });
    if (metadata.existing_app) items.push({ label: isAr ? "تطبيق حالي" : "Existing App", value: metadata.existing_app });
    if (metadata.backend_preference) items.push({ label: isAr ? "الخلفية" : "Backend", value: metadata.backend_preference });
  } else if (serviceType === "website") {
    if (metadata.website_type) items.push({ label: isAr ? "نوع الموقع" : "Website Type", value: metadata.website_type });
    if (metadata.estimated_pages) items.push({ label: isAr ? "عدد الصفحات" : "Est. Pages", value: metadata.estimated_pages });
    if (metadata.cms_needed) items.push({ label: "CMS", value: metadata.cms_needed });
    if (metadata.reference_sites) items.push({ label: isAr ? "مواقع مرجعية" : "Reference Sites", value: metadata.reference_sites });
  } else if (serviceType === "enterprise_system") {
    if (metadata.required_modules) items.push({ label: isAr ? "الوحدات" : "Modules", value: <div className="flex gap-1 flex-wrap">{(metadata.required_modules || []).map((m: string) => <Badge key={m} variant="outline" className="text-xs">{m}</Badge>)}</div> });
    if (metadata.expected_users) items.push({ label: isAr ? "المستخدمون المتوقعون" : "Expected Users", value: metadata.expected_users });
    if (metadata.current_system) items.push({ label: isAr ? "النظام الحالي" : "Current System", value: metadata.current_system });
    if (metadata.integration_needs) items.push({ label: isAr ? "التكامل" : "Integrations", value: metadata.integration_needs });
  } else if (serviceType === "uiux_design") {
    if (metadata.deliverables) items.push({ label: isAr ? "التسليمات" : "Deliverables", value: <div className="flex gap-1 flex-wrap">{(metadata.deliverables || []).map((d: string) => <Badge key={d} variant="outline" className="text-xs">{d}</Badge>)}</div> });
    if (metadata.target_platform) items.push({ label: isAr ? "المنصة" : "Platform", value: metadata.target_platform });
    if (metadata.existing_design) items.push({ label: isAr ? "تصميم حالي" : "Existing Design", value: metadata.existing_design });
    if (metadata.brand_guidelines) items.push({ label: isAr ? "إرشادات العلامة" : "Brand Guidelines", value: metadata.brand_guidelines });
  } else if (serviceType === "team_augmentation") {
    if (metadata.headcount) items.push({ label: isAr ? "العدد" : "Headcount", value: metadata.headcount });
    if (metadata.engagement_model) items.push({ label: isAr ? "نموذج العمل" : "Model", value: metadata.engagement_model });
    if (metadata.skills) items.push({ label: isAr ? "المهارات" : "Skills", value: <div className="flex gap-1 flex-wrap">{(metadata.skills || []).map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div> });
    if (metadata.seniority) items.push({ label: isAr ? "المستوى" : "Seniority", value: metadata.seniority });
    if (metadata.engagement_duration) items.push({ label: isAr ? "المدة" : "Duration", value: metadata.engagement_duration });
  } else if (serviceType === "qa_testing") {
    if (metadata.test_types) items.push({ label: isAr ? "أنواع الاختبار" : "Test Types", value: <div className="flex gap-1 flex-wrap">{(metadata.test_types || []).map((t: string) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}</div> });
    if (metadata.product_url) items.push({ label: "URL", value: metadata.product_url });
    if (metadata.environment) items.push({ label: isAr ? "البيئة" : "Environment", value: metadata.environment });
    if (metadata.engagement_type) items.push({ label: isAr ? "نوع العمل" : "Engagement", value: metadata.engagement_type });
  } else if (serviceType === "it_services") {
    if (metadata.service_category) items.push({ label: isAr ? "الفئة" : "Category", value: metadata.service_category });
    if (metadata.sla_requirement) items.push({ label: "SLA", value: metadata.sla_requirement });
    if (metadata.engagement_type) items.push({ label: isAr ? "نوع العمل" : "Engagement", value: metadata.engagement_type });
  } else if (serviceType === "dedicated_squad") {
    if (metadata.team_size) items.push({ label: isAr ? "حجم الفريق" : "Team Size", value: metadata.team_size });
    if (metadata.tech_stack) items.push({ label: isAr ? "التقنيات" : "Tech Stack", value: metadata.tech_stack });
    if (metadata.includes_pm) items.push({ label: "PM", value: metadata.includes_pm });
    if (metadata.engagement_duration) items.push({ label: isAr ? "المدة" : "Duration", value: metadata.engagement_duration });
  }

  if (items.length === 0) return null;

  return (
    <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
      <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
        <Tag className="h-3 w-3" /> {isAr ? "تفاصيل إضافية" : "Type-Specific Details"}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {items.map((item, i) => (
          <div key={i}>
            <span className="text-muted-foreground">{item.label}: </span>
            <span className="font-medium">{typeof item.value === "string" ? item.value : item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminServiceRequests() {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();

  const [categoryTab, setCategoryTab] = useState("projects");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [detailTab, setDetailTab] = useState("details");
  const [adminNotes, setAdminNotes] = useState("");
  const [internalEstimate, setInternalEstimate] = useState("");
  const [savingField, setSavingField] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-service-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ServiceRequest[];
    },
    staleTime: 60000,
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["admin-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Quote[];
    },
    staleTime: 60000,
  });

  // Derive category from data
  const getCategory = (r: ServiceRequest) => {
    if (r.category) return r.category;
    return SERVICE_TYPES.includes(r.service_type) ? "service" : "project";
  };

  const projectRequests = useMemo(() => requests.filter(r => getCategory(r) === "project"), [requests]);
  const serviceRequests = useMemo(() => requests.filter(r => getCategory(r) === "service"), [requests]);

  const categoryFiltered = useMemo(() => {
    if (categoryTab === "projects") return projectRequests;
    if (categoryTab === "services") return serviceRequests;
    return requests;
  }, [categoryTab, projectRequests, serviceRequests, requests]);

  // Filter
  const filtered = useMemo(() => {
    return categoryFiltered.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
      if (typeFilter !== "all" && r.service_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.contact_name.toLowerCase().includes(q) ||
          r.contact_email.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q);
      }
      return true;
    });
  }, [categoryFiltered, statusFilter, priorityFilter, typeFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateField = async (id: string, field: string, value: any) => {
    setSavingField(field);
    const { error } = await supabase.from("service_requests").update({ [field]: value }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(isAr ? "تم الحفظ" : "Saved");
      queryClient.invalidateQueries({ queryKey: ["admin-service-requests"] });
      if (selected?.id === id) setSelected({ ...selected, [field]: value });
    }
    setSavingField(null);
  };

  const openDetail = (req: ServiceRequest) => {
    setSelected(req);
    setAdminNotes(req.admin_notes || "");
    setInternalEstimate(req.internal_estimate_usd?.toString() || "");
    setDetailTab("details");
  };

  const getQuoteForRequest = (requestId: string) => quotes.find(q => q.service_request_id === requestId);
  const initials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const isServicesTab = categoryTab === "services";

  // Type filter options based on category
  const typeFilterOptions = useMemo(() => {
    if (categoryTab === "projects") return Object.entries(SERVICE_TYPE_LABELS).filter(([k]) => PROJECT_TYPES.includes(k));
    if (categoryTab === "services") return Object.entries(SERVICE_TYPE_LABELS).filter(([k]) => SERVICE_TYPES.includes(k));
    return Object.entries(SERVICE_TYPE_LABELS);
  }, [categoryTab]);

  return (
    <div className="space-y-6">
      <SEO title="Service Requests — Admin" noIndex />
      <AdminPageHeader
        title={isAr ? "طلبات الخدمة" : "Service Requests"}
        subtitle={isAr ? "إدارة طلبات المشاريع والخدمات" : "Manage project and service requests"}
      />

      {/* Category Tabs */}
      <Tabs value={categoryTab} onValueChange={v => { setCategoryTab(v); setPage(1); setTypeFilter("all"); setStatusFilter("all"); }}>
        <TabsList>
          <TabsTrigger value="projects" className="gap-1.5">
            {isAr ? "المشاريع" : "Projects"}
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{projectRequests.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5">
            {isAr ? "الخدمات" : "Services"}
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{serviceRequests.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1.5">
            {isAr ? "الكل" : "All"}
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{requests.length}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث بالاسم أو البريد أو العنوان..." : "Search by name, email, or title..."}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="ps-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder={isAr ? "الحالة" : "Status"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{isAr ? v.labelAr : v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={v => { setPriorityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder={isAr ? "الأولوية" : "Priority"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
            <SelectItem value="normal">{isAr ? "عادي" : "Normal"}</SelectItem>
            <SelectItem value="high">{isAr ? "عالي" : "High"}</SelectItem>
            <SelectItem value="urgent">{isAr ? "عاجل" : "Urgent"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder={isAr ? "النوع" : "Type"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
            {typeFilterOptions.map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ExportCSVButton data={filtered} filename="service-requests" />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t("admin.loading")}</div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{isAr ? "لا توجد طلبات" : "No requests found"}</div>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto"><Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                <TableHead>{isAr ? "العميل" : "Client"}</TableHead>
                {isServicesTab ? (
                  <>
                    <TableHead>{isAr ? "نموذج العمل" : "Engagement"}</TableHead>
                    <TableHead>{isAr ? "العدد" : "Headcount"}</TableHead>
                    <TableHead>{isAr ? "المدة" : "Duration"}</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>{isAr ? "الميزانية" : "Budget"}</TableHead>
                    <TableHead>{isAr ? "الجدول" : "Timeline"}</TableHead>
                  </>
                )}
                <TableHead>{isAr ? "الأولوية" : "Priority"}</TableHead>
                <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(req => {
                const TypeIcon = SERVICE_TYPE_ICONS[req.service_type] || FileInput;
                const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.new;
                const pc = PRIORITY_CONFIG[req.priority || "normal"] || PRIORITY_CONFIG.normal;
                const meta = (req.metadata || {}) as Record<string, any>;
                return (
                  <TableRow key={req.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openDetail(req)}>
                    <TableCell>
                      <Badge className={`${sc.color} border text-xs`}>{isAr ? sc.labelAr : sc.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <TypeIcon className="h-3 w-3" />
                        {SERVICE_TYPE_LABELS[req.service_type] || req.service_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="truncate block text-sm font-medium">{req.title}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {initials(req.contact_name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm truncate">{req.contact_name}</div>
                          <div className="text-xs text-muted-foreground truncate">{req.contact_email}</div>
                        </div>
                      </div>
                    </TableCell>
                    {isServicesTab ? (
                      <>
                        <TableCell className="text-sm">{meta.engagement_model || meta.engagement_type || "—"}</TableCell>
                        <TableCell className="text-sm">{meta.headcount || meta.team_size || "—"}</TableCell>
                        <TableCell className="text-sm">{meta.engagement_duration || "—"}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-sm">{BUDGET_LABELS[req.budget_range || ""] || "—"}</TableCell>
                        <TableCell className="text-sm">{req.timeline || "—"}</TableCell>
                      </>
                    )}
                    <TableCell>
                      <Badge className={`${pc.color} border-0 text-xs`}>{pc.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); openDetail(req); }}>
                            <Eye className="me-2 h-4 w-4" /> {isAr ? "عرض" : "View"}
                          </DropdownMenuItem>
                          {req.status === "new" && (
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); updateField(req.id, "status", "reviewing"); }}>
                              <Clock className="me-2 h-4 w-4" /> {isAr ? "بدء المراجعة" : "Start Review"}
                            </DropdownMenuItem>
                          )}
                          {["new", "reviewing"].includes(req.status) && (
                            <>
                              <DropdownMenuItem asChild onClick={e => e.stopPropagation()}>
                                <Link to={`/admin/quotes/new?request_id=${req.id}`}>
                                  <DollarSign className="me-2 h-4 w-4" /> {isAr ? (isServicesTab ? "إنشاء عرض" : "إنشاء تسعير") : (isServicesTab ? "Create Proposal" : "Create Quote")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={e => { e.stopPropagation(); updateField(req.id, "status", "rejected"); }}>
                                <AlertTriangle className="me-2 h-4 w-4" /> {isAr ? "رفض" : "Reject"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        </Card>
      )}
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <FileInput className="h-5 w-5 text-primary" />
                  {selected.title}
                </DialogTitle>
              </DialogHeader>

              <Tabs value={detailTab} onValueChange={setDetailTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="details" className="flex-1">{isAr ? "التفاصيل" : "Details"}</TabsTrigger>
                  <TabsTrigger value="quote" className="flex-1">{isAr ? "عرض السعر" : "Quote"}</TabsTrigger>
                  <TabsTrigger value="activity" className="flex-1">{isAr ? "النشاط" : "Activity"}</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  {/* Client info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">{isAr ? "الاسم" : "Name"}:</span> <span className="font-medium">{selected.contact_name}</span></div>
                    <div><span className="text-muted-foreground">{isAr ? "البريد" : "Email"}:</span> <span className="font-medium">{selected.contact_email}</span></div>
                    {selected.contact_phone && <div><span className="text-muted-foreground">{isAr ? "الهاتف" : "Phone"}:</span> {selected.contact_phone}</div>}
                    {selected.company_name && <div><span className="text-muted-foreground">{isAr ? "الشركة" : "Company"}:</span> {selected.company_name}</div>}
                    <div><span className="text-muted-foreground">{isAr ? "النوع" : "Type"}:</span> {SERVICE_TYPE_LABELS[selected.service_type]}</div>
                    <div><span className="text-muted-foreground">{isAr ? "الفئة" : "Category"}:</span> <Badge variant="outline" className="text-xs">{getCategory(selected) === "project" ? (isAr ? "مشروع" : "Project") : (isAr ? "خدمة" : "Service")}</Badge></div>
                    {getCategory(selected) === "project" && (
                      <>
                        <div><span className="text-muted-foreground">{isAr ? "الميزانية" : "Budget"}:</span> {BUDGET_LABELS[selected.budget_range || ""] || "—"}</div>
                        <div><span className="text-muted-foreground">{isAr ? "الجدول" : "Timeline"}:</span> {selected.timeline || "—"}</div>
                      </>
                    )}
                    <div><span className="text-muted-foreground">{isAr ? "تاريخ البدء" : "Start date"}:</span> {selected.preferred_start_date || "—"}</div>
                  </div>

                  {/* Metadata */}
                  <MetadataDisplay metadata={selected.metadata} serviceType={selected.service_type} isAr={isAr} />

                  {/* Description */}
                  <div>
                    <div className="text-sm font-medium mb-1">{isAr ? "الوصف" : "Description"}</div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">{selected.description}</p>
                  </div>
                  {selected.requirements && (
                    <div>
                      <div className="text-sm font-medium mb-1">{isAr ? "المتطلبات" : "Requirements"}</div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">{selected.requirements}</p>
                    </div>
                  )}

                  {/* Attachments */}
                  {selected.attachments && selected.attachments.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-1">{isAr ? "المرفقات" : "Attachments"}</div>
                      <div className="flex flex-wrap gap-2">
                        {selected.attachments.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="text-xs bg-muted rounded-lg px-3 py-1.5 hover:bg-muted/80 flex items-center gap-1">
                            <FileText className="h-3 w-3" /> {url.split("/").pop()?.slice(0, 30)}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin section */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="text-sm font-bold text-primary">{isAr ? "إدارة" : "Admin"}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">{t("admin.status")}</label>
                        <Select value={selected.status} onValueChange={v => updateField(selected.id, "status", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{isAr ? v.labelAr : v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">{isAr ? "الأولوية" : "Priority"}</label>
                        <Select value={selected.priority || "normal"} onValueChange={v => updateField(selected.id, "priority", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">{isAr ? "التقدير الداخلي ($)" : "Internal Estimate ($)"}</label>
                      <div className="flex gap-2">
                        <Input type="number" value={internalEstimate} onChange={e => setInternalEstimate(e.target.value)} placeholder="0.00" />
                        <Button size="sm" disabled={savingField === "internal_estimate_usd"}
                          onClick={() => updateField(selected.id, "internal_estimate_usd", parseFloat(internalEstimate) || null)}>
                          {t("admin.save")}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">{isAr ? "ملاحظات الإدارة" : "Admin Notes"}</label>
                      <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} />
                      <Button size="sm" className="mt-2" disabled={savingField === "admin_notes"}
                        onClick={() => updateField(selected.id, "admin_notes", adminNotes)}>
                        {t("admin.save")}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="quote" className="mt-4">
                  {(() => {
                    const quote = getQuoteForRequest(selected.id);
                    if (!quote) return (
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="mx-auto h-10 w-10 mb-3 opacity-30" />
                        <p>{isAr ? "لم يتم إنشاء عرض سعر بعد" : "No quote created yet"}</p>
                        <Button variant="outline" size="sm" className="mt-3" asChild>
                          <Link to={`/admin/quotes/new?request_id=${selected.id}`}>
                            {isAr ? "إنشاء عرض سعر" : "Create Quote"}
                          </Link>
                        </Button>
                      </div>
                    );
                    const items = Array.isArray(quote.line_items) ? quote.line_items : [];
                    const qsc = STATUS_CONFIG[quote.status] || STATUS_CONFIG.new;
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono text-sm font-bold">{quote.quote_number}</span>
                            <Badge className={`${qsc.color} border text-xs ms-2`}>{isAr ? qsc.labelAr : qsc.label}</Badge>
                          </div>
                          <span className="text-lg font-bold text-primary">${Number(quote.total_usd).toLocaleString()}</span>
                        </div>
                        <div className="overflow-x-auto"><Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{isAr ? "البند" : "Item"}</TableHead>
                              <TableHead className="text-end">{isAr ? "الساعات" : "Hours"}</TableHead>
                              <TableHead className="text-end">{isAr ? "السعر" : "Rate"}</TableHead>
                              <TableHead className="text-end">{isAr ? "الإجمالي" : "Total"}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item: any, i: number) => (
                              <TableRow key={i}>
                                <TableCell className="text-sm">{item.description}</TableCell>
                                <TableCell className="text-end text-sm">{item.hours}</TableCell>
                                <TableCell className="text-end text-sm">${item.rate}</TableCell>
                                <TableCell className="text-end text-sm font-medium">${item.total}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table></div>
                        <div className="text-sm space-y-1 text-end">
                          <div>{isAr ? "المجموع الفرعي" : "Subtotal"}: ${Number(quote.subtotal_usd).toLocaleString()}</div>
                          {quote.discount_pct ? <div>{isAr ? "خصم" : "Discount"}: {quote.discount_pct}%</div> : null}
                          {quote.tax_pct ? <div>{isAr ? "ضريبة" : "Tax"}: {quote.tax_pct}%</div> : null}
                          <div className="font-bold text-base">{isAr ? "الإجمالي" : "Total"}: ${Number(quote.total_usd).toLocaleString()}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          {quote.valid_until && <div>{isAr ? "صالح حتى" : "Valid until"}: {quote.valid_until}</div>}
                          {quote.sent_at && <div>{isAr ? "أرسل" : "Sent"}: {formatDistanceToNow(new Date(quote.sent_at), { addSuffix: true })}</div>}
                          {quote.viewed_at && <div>{isAr ? "شوهد" : "Viewed"}: {formatDistanceToNow(new Date(quote.viewed_at), { addSuffix: true })}</div>}
                          {quote.responded_at && <div>{isAr ? "رد" : "Responded"}: {formatDistanceToNow(new Date(quote.responded_at), { addSuffix: true })}</div>}
                          {quote.payment_terms && <div>{isAr ? "شروط الدفع" : "Payment terms"}: {quote.payment_terms}</div>}
                          {quote.estimated_duration && <div>{isAr ? "المدة المتوقعة" : "Duration"}: {quote.estimated_duration}</div>}
                        </div>
                      </div>
                    );
                  })()}
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <div className="space-y-3">
                    {[
                      { icon: FileInput, label: isAr ? "تم إنشاء الطلب" : "Request created", date: selected.created_at },
                      ...(getQuoteForRequest(selected.id)?.sent_at ? [{
                        icon: DollarSign, label: isAr ? "تم إرسال عرض السعر" : "Quote sent",
                        date: getQuoteForRequest(selected.id)!.sent_at!
                      }] : []),
                      ...(getQuoteForRequest(selected.id)?.viewed_at ? [{
                        icon: Eye, label: isAr ? "شوهد عرض السعر" : "Quote viewed",
                        date: getQuoteForRequest(selected.id)!.viewed_at!
                      }] : []),
                      ...(getQuoteForRequest(selected.id)?.responded_at ? [{
                        icon: MessageSquare, label: isAr ? "رد العميل" : "Client responded",
                        date: getQuoteForRequest(selected.id)!.responded_at!
                      }] : []),
                    ].map((event, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <event.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">{event.label}</span>
                          <span className="text-muted-foreground ms-2">
                            {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    ))}
                    {selected.status !== "new" && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <span className="font-medium">{isAr ? "الحالة الحالية" : "Current status"}: </span>
                          <Badge className={`${(STATUS_CONFIG[selected.status] || STATUS_CONFIG.new).color} border text-xs`}>
                            {isAr ? (STATUS_CONFIG[selected.status]?.labelAr) : (STATUS_CONFIG[selected.status]?.label)}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
