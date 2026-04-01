import { formatCurrency } from "@/lib/format";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format, parseISO, formatDistanceToNow, isPast } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Plus, FolderOpen, ChevronDown, ChevronUp,
  Paperclip, CheckCircle2,
  Flag, Package, MessageSquare, AlertTriangle, StickyNote,
  Wrench, Users, ShieldCheck, UsersRound, Tag
} from "lucide-react";

const SERVICE_STATUS_STEPS = ["new", "reviewing", "quoted", "approved", "in_progress", "completed"];
const SERVICE_STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  new: { en: "Submitted", ar: "مقدم" },
  reviewing: { en: "Under Review", ar: "قيد المراجعة" },
  quoted: { en: "Quoted", ar: "تم التسعير" },
  approved: { en: "Approved", ar: "موافق عليه" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ" },
  completed: { en: "Completed", ar: "مكتمل" },
  rejected: { en: "Rejected", ar: "مرفوض" },
  on_hold: { en: "On Hold", ar: "معلق" },
  closed: { en: "Closed", ar: "مغلق" },
};

const QUOTE_STATUS: Record<string, { color: string; en: string; ar: string }> = {
  sent: { color: "bg-blue-500/15 text-blue-600", en: "Pending", ar: "معلق" },
  approved: { color: "bg-green-500/15 text-green-600", en: "Approved", ar: "موافق" },
  rejected: { color: "bg-red-500/15 text-red-600", en: "Declined", ar: "مرفوض" },
  expired: { color: "bg-gray-500/15 text-gray-600", en: "Expired", ar: "منتهي" },
  revised: { color: "bg-amber-500/15 text-amber-600", en: "Revised", ar: "معدل" },
};

const PROJECT_STATUS: Record<string, { color: string; en: string; ar: string }> = {
  planning: { color: "bg-blue-500/15 text-blue-600", en: "Planning", ar: "تخطيط" },
  in_progress: { color: "bg-amber-500/15 text-amber-600", en: "In Progress", ar: "قيد التنفيذ" },
  review: { color: "bg-purple-500/15 text-purple-600", en: "Review", ar: "مراجعة" },
  delivered: { color: "bg-teal-500/15 text-teal-600", en: "Delivered", ar: "تم التسليم" },
  completed: { color: "bg-green-500/15 text-green-600", en: "Completed", ar: "مكتمل" },
  on_hold: { color: "bg-gray-500/15 text-gray-600", en: "On Hold", ar: "معلق" },
};

const UPDATE_ICONS: Record<string, any> = {
  milestone: Flag,
  deliverable: Package,
  update: MessageSquare,
  issue: AlertTriangle,
  note: StickyNote,
};

const SERVICE_TYPES = ["team_augmentation", "qa_testing", "it_services", "dedicated_squad"];

const SERVICE_TYPE_ICONS: Record<string, any> = {
  team_augmentation: Users,
  qa_testing: ShieldCheck,
  it_services: Wrench,
  dedicated_squad: UsersRound,
};

const SERVICE_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  team_augmentation: { en: "Team Augmentation", ar: "تعزيز الفريق" },
  qa_testing: { en: "QA & Testing", ar: "اختبار الجودة" },
  it_services: { en: "IT Services", ar: "خدمات تقنية" },
  dedicated_squad: { en: "Dedicated Squad", ar: "فريق مخصص" },
};

const ENGAGEMENT_STATUS: Record<string, { en: string; ar: string; color: string }> = {
  new: { en: "Pending Review", ar: "بانتظار المراجعة", color: "bg-blue-500/15 text-blue-600" },
  reviewing: { en: "Under Review", ar: "قيد المراجعة", color: "bg-amber-500/15 text-amber-600" },
  quoted: { en: "Proposal Sent", ar: "تم إرسال العرض", color: "bg-purple-500/15 text-purple-600" },
  approved: { en: "Active", ar: "نشط", color: "bg-green-500/15 text-green-600" },
  in_progress: { en: "Active", ar: "نشط", color: "bg-green-500/15 text-green-600" },
  completed: { en: "Completed", ar: "مكتمل", color: "bg-emerald-500/15 text-emerald-600" },
  rejected: { en: "Declined", ar: "مرفوض", color: "bg-red-500/15 text-red-600" },
  on_hold: { en: "On Hold", ar: "معلق", color: "bg-gray-500/15 text-gray-600" },
  closed: { en: "Closed", ar: "مغلق", color: "bg-gray-500/15 text-gray-600" },
};

const fmtCurrency = (v: number | null, lang: string) =>
  v != null ? formatCurrency(v, lang) : "—";

export default function MyProjects() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ["my-service-requests", user?.id],
    enabled: !!user,
    staleTime: 60000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["my-quotes", user?.id],
    enabled: !!user,
    staleTime: 60000,
    queryFn: async () => {
      const requestIds = requests.map((r) => r.id);
      if (requestIds.length === 0) return [];
      const { data, error } = await supabase
        .from("quotes")
        .select("*, service_requests(title, contact_name)")
        .in("service_request_id", requestIds)
        .not("status", "eq", "draft")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["my-projects", user?.id],
    enabled: !!user,
    staleTime: 60000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tracking")
        .select("*")
        .eq("user_id", user!.id)
        .not("status", "eq", "cancelled")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Split requests by category
  const getCategory = (r: any) => {
    if (r.category) return r.category;
    return SERVICE_TYPES.includes(r.service_type) ? "service" : "project";
  };

  const projectRequests = useMemo(() => requests.filter(r => getCategory(r) === "project"), [requests]);
  const serviceRequests = useMemo(() => requests.filter(r => getCategory(r) === "service"), [requests]);

  const projectQuotes = useMemo(() => {
    const projectRequestIds = new Set(projectRequests.map(r => r.id));
    return quotes.filter(q => projectRequestIds.has(q.service_request_id));
  }, [quotes, projectRequests]);

  const serviceQuotes = useMemo(() => {
    const serviceRequestIds = new Set(serviceRequests.map(r => r.id));
    return quotes.filter(q => serviceRequestIds.has(q.service_request_id));
  }, [quotes, serviceRequests]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <SEO title={isAr ? "مشاريعي | DevWady" : "My Projects | DevWady"} description="Track your service requests, quotes, and active projects" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "مشاريعي وخدماتي" : "My Projects & Services"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isAr ? "تتبع طلباتك وعروض الأسعار والمشاريع النشطة" : "Track your requests, quotes, and active projects"}</p>
        </div>
      </div>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="projects" className="gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            {isAr ? "مشاريعي" : "My Projects"}
            {(projectRequests.length + projects.length) > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{projectRequests.length + projects.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            {isAr ? "خدماتي" : "My Services"}
            {serviceRequests.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{serviceRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="flex justify-end">
            <Button asChild className="gap-2">
              <Link to="/start-project"><Plus className="h-4 w-4" />{isAr ? "مشروع جديد" : "Start New Project"}</Link>
            </Button>
          </div>

          {projectRequests.length === 0 && projects.length === 0 ? (
            <Card className="p-8 text-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">{isAr ? "ابدأ مشروعك الأول مع DevWady" : "Start your first project with DevWady"}</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{isAr ? "نصمم ونبني التطبيقات والمواقع والأنظمة" : "We design and build apps, websites, and systems"}</p>
              <Button asChild><Link to="/start-project">{isAr ? "ابدأ مشروع" : "Start a Project"}</Link></Button>
            </Card>
          ) : (
            <>
              {/* Active Projects (from project_tracking) */}
              {projects.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "المشاريع النشطة" : "Active Projects"}</h2>
                  <ProjectsSection projects={projects} isAr={isAr} lang={lang} />
                </div>
              )}

              {/* Project Requests */}
              {projectRequests.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "طلبات المشاريع" : "Project Requests"}</h2>
                  <RequestsSection requests={projectRequests} isAr={isAr} />
                </div>
              )}

              {/* Project Quotes */}
              {projectQuotes.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "عروض الأسعار" : "Quotes"}</h2>
                  <QuotesTab quotes={projectQuotes} isAr={isAr} queryClient={queryClient} lang={lang} />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="flex justify-end">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/request-service"><Plus className="h-4 w-4" />{isAr ? "طلب خدمة جديدة" : "Request New Service"}</Link>
            </Button>
          </div>

          {serviceRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">{isAr ? "وسّع فريقك مع خدماتنا" : "Scale your team with our services"}</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{isAr ? "تعزيز الفريق، اختبار الجودة، خدمات تقنية، وفريق مخصص" : "Team augmentation, QA, IT services, and dedicated squads"}</p>
              <Button asChild><Link to="/request-service">{isAr ? "طلب خدمة" : "Request a Service"}</Link></Button>
            </Card>
          ) : (
            <>
              {/* Service Engagements */}
              <div className="space-y-4">
                {serviceRequests.map((r) => (
                  <ServiceCard key={r.id} request={r} isAr={isAr} lang={lang} quote={serviceQuotes.find(q => q.service_request_id === r.id)} queryClient={queryClient} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Service Card (engagement-based) ─── */
function ServiceCard({ request: r, isAr, quote }: { request: any; isAr: boolean; lang: string; quote?: any; queryClient: any }) {
  const [expanded, setExpanded] = useState(false);
  const meta = (r.metadata || {}) as Record<string, any>;
  const TypeIcon = SERVICE_TYPE_ICONS[r.service_type] || Wrench;
  const typeLabel = SERVICE_TYPE_LABELS[r.service_type] || { en: r.service_type, ar: r.service_type };
  const engStatus = ENGAGEMENT_STATUS[r.status] || ENGAGEMENT_STATUS.new;

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1 text-xs">
              <TypeIcon className="h-3 w-3" />
              {isAr ? typeLabel.ar : typeLabel.en}
            </Badge>
            <Badge className={cn(engStatus.color, "text-xs")}>{isAr ? engStatus.ar : engStatus.en}</Badge>
          </div>
          <h3 className="font-bold mt-2">{r.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{r.description?.slice(0, 120)}{r.description?.length > 120 ? "..." : ""}</p>
        </div>
        <div className="text-xs text-muted-foreground shrink-0">
          {formatDistanceToNow(parseISO(r.created_at), { addSuffix: true })}
        </div>
      </div>

      {/* Service-specific metadata summary */}
      {Object.keys(meta).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {r.service_type === "team_augmentation" && (
            <>
              {meta.headcount && <Badge variant="outline" className="text-xs">{isAr ? "العدد" : "Headcount"}: {meta.headcount}</Badge>}
              {meta.engagement_model && <Badge variant="outline" className="text-xs">{meta.engagement_model}</Badge>}
              {meta.seniority && <Badge variant="outline" className="text-xs">{meta.seniority}</Badge>}
              {meta.engagement_duration && <Badge variant="outline" className="text-xs">{meta.engagement_duration}</Badge>}
            </>
          )}
          {r.service_type === "qa_testing" && (
            <>
              {meta.engagement_type && <Badge variant="outline" className="text-xs">{meta.engagement_type}</Badge>}
              {meta.test_types?.length > 0 && <Badge variant="outline" className="text-xs">{meta.test_types.length} {isAr ? "أنواع اختبار" : "test types"}</Badge>}
            </>
          )}
          {r.service_type === "it_services" && (
            <>
              {meta.service_category && <Badge variant="outline" className="text-xs">{meta.service_category}</Badge>}
              {meta.sla_requirement && <Badge variant="outline" className="text-xs">SLA: {meta.sla_requirement}</Badge>}
            </>
          )}
          {r.service_type === "dedicated_squad" && (
            <>
              {meta.team_size && <Badge variant="outline" className="text-xs">{isAr ? "حجم الفريق" : "Team"}: {meta.team_size}</Badge>}
              {meta.includes_pm && <Badge variant="outline" className="text-xs">PM: {meta.includes_pm}</Badge>}
              {meta.engagement_duration && <Badge variant="outline" className="text-xs">{meta.engagement_duration}</Badge>}
            </>
          )}
        </div>
      )}

      {/* Skills tags for team augmentation */}
      {r.service_type === "team_augmentation" && meta.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {meta.skills.map((s: string) => (
            <Badge key={s} className="bg-primary/10 text-primary text-xs border-0">{s}</Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="gap-1 text-xs">
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {isAr ? "التفاصيل" : "Details"}
        </Button>
        {quote && (
          <Badge className={cn(
            quote.status === "sent" ? "bg-purple-500/15 text-purple-600" : 
            quote.status === "approved" ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground",
            "text-xs"
          )}>
            {isAr ? "عرض" : "Proposal"}: {quote.status === "sent" ? (isAr ? "بانتظار الرد" : "Pending") : quote.status}
          </Badge>
        )}
        <Link to={`/my-projects/${r.id}`} className="ms-auto">
          <Button variant="outline" size="sm" className="text-xs">{isAr ? "عرض التفاصيل" : "View Details"}</Button>
        </Link>
      </div>

      {expanded && (
        <div className="border-t pt-3 space-y-3 animate-fade-in">
          {r.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "الوصف" : "Description"}</p>
              <p className="text-sm whitespace-pre-wrap">{r.description}</p>
            </div>
          )}

          {/* Full metadata display */}
          {Object.keys(meta).length > 0 && (
            <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> {isAr ? "تفاصيل الخدمة" : "Service Details"}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {Object.entries(meta).map(([key, value]) => {
                  if (!value || (Array.isArray(value) && value.length === 0)) return null;
                  const displayValue = Array.isArray(value) ? value.join(", ") : String(value);
                  return (
                    <div key={key}>
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}: </span>
                      <span className="font-medium">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {r.requirements && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "المتطلبات" : "Requirements"}</p>
              <p className="text-sm whitespace-pre-wrap">{r.requirements}</p>
            </div>
          )}
          {r.attachments?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "المرفقات" : "Attachments"}</p>
              <div className="space-y-1">
                {r.attachments.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />{url.split("/").pop()}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* ─── Requests Section (project requests) ─── */
function RequestsSection({ requests, isAr }: { requests: any[]; isAr: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {requests.map((r) => {
        const isOpen = expanded === r.id;
        const statusLabel = SERVICE_STATUS_LABELS[r.status] || { en: r.status, ar: r.status };
        const currentStep = SERVICE_STATUS_STEPS.indexOf(r.status);

        return (
          <Card key={r.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-primary/10 text-primary text-xs">{r.service_type?.replace(/_/g, " ")}</Badge>
                  <Badge variant="outline" className="text-xs">{isAr ? statusLabel.ar : statusLabel.en}</Badge>
                  {r.priority === "urgent" && <Badge variant="destructive" className="text-xs">{isAr ? "عاجل" : "Urgent"}</Badge>}
                </div>
                <h3 className="font-bold mt-2">{r.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{r.description?.slice(0, 150)}{r.description?.length > 150 ? "..." : ""}</p>
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(parseISO(r.created_at), { addSuffix: true })}
              </div>
            </div>

            {/* Status stepper */}
            {currentStep >= 0 && (
              <div className="flex items-center gap-1">
                {SERVICE_STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  return (
                    <div key={step} className="flex items-center gap-1 flex-1">
                      <div className={cn("h-2 rounded-full flex-1 transition-colors", done ? "bg-primary" : "bg-muted")} />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {r.budget_range && <span>{r.budget_range.replace(/_/g, " ")}</span>}
              {r.timeline && <span>· {r.timeline.replace(/_/g, " ")}</span>}
              {r.attachments?.length > 0 && (
                <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{r.attachments.length}</span>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setExpanded(isOpen ? null : r.id)} className="gap-1 text-xs">
                {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {isAr ? "عرض التفاصيل" : "View details"}
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs ms-auto">
                <Link to={`/my-projects/${r.id}`}>{isAr ? "عرض" : "View"}</Link>
              </Button>
            </div>

            {isOpen && (
              <div className="border-t pt-4 space-y-3 animate-fade-in">
                {r.description && <div><p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "الوصف" : "Description"}</p><p className="text-sm whitespace-pre-wrap">{r.description}</p></div>}
                {r.requirements && <div><p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "المتطلبات" : "Requirements"}</p><p className="text-sm whitespace-pre-wrap">{r.requirements}</p></div>}
                {/* Metadata */}
                {r.metadata && Object.keys(r.metadata).length > 0 && (
                  <div className="border rounded-lg p-3 bg-muted/20">
                    <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {isAr ? "تفاصيل المشروع" : "Project Details"}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {Object.entries(r.metadata).map(([key, value]) => {
                        if (!value || (Array.isArray(value) && (value as any[]).length === 0)) return null;
                        const displayValue = Array.isArray(value) ? (value as string[]).join(", ") : String(value);
                        return (
                          <div key={key}>
                            <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}: </span>
                            <span className="font-medium">{displayValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {r.attachments?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "المرفقات" : "Attachments"}</p>
                    <div className="space-y-1">
                      {r.attachments.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />{url.split("/").pop()}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ─── Quotes Tab ─── */
function QuotesTab({ quotes, isAr, queryClient, lang }: { quotes: any[]; isAr: boolean; queryClient: any; lang: string }) {
  const [viewQuote, setViewQuote] = useState<any>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [approveQuoteId, setApproveQuoteId] = useState<string | null>(null);

  const handleApprove = async (quote: any) => {
    setSaving(true);
    const { error } = await supabase.from("quotes").update({ status: "approved", responded_at: new Date().toISOString() }).eq("id", quote.id);
    if (!error) {
      await supabase.from("service_requests").update({ status: "approved" }).eq("id", quote.service_request_id);
      toast.success(isAr ? "تم قبول العرض" : "Quote approved!");
      queryClient.invalidateQueries({ queryKey: ["my-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["my-service-requests"] });
      setViewQuote(null);
    } else toast.error(error.message);
    setSaving(false);
    setApproveQuoteId(null);
  };

  const handleReject = async (quote: any) => {
    setSaving(true);
    const { error } = await supabase.from("quotes").update({ status: "rejected", responded_at: new Date().toISOString() }).eq("id", quote.id);
    if (!error) {
      toast.success(isAr ? "تم رفض العرض" : "Changes requested");
      queryClient.invalidateQueries({ queryKey: ["my-quotes"] });
      setFeedbackOpen(false);
      setFeedback("");
      setViewQuote(null);
    } else toast.error(error.message);
    setSaving(false);
  };

  if (quotes.length === 0) return null;

  return (
    <>
      <div className="space-y-4">
        {quotes.map((q) => {
          const qs = QUOTE_STATUS[q.status] || QUOTE_STATUS.sent;
          const expired = q.valid_until && isPast(parseISO(q.valid_until)) && q.status === "sent";
          return (
            <Card key={q.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs text-muted-foreground">{q.quote_number}</span>
                  <h3 className="font-bold mt-1">{q.title}</h3>
                  <p className="text-sm text-muted-foreground">{q.service_requests?.title}</p>
                </div>
                <div className="text-end shrink-0">
                  <div className="text-xl font-bold">{fmtCurrency(q.total_usd, lang)}</div>
                  <Badge className={cn(qs.color, "mt-1")}>{isAr ? qs.ar : qs.en}</Badge>
                  {expired && <Badge variant="destructive" className="mt-1 ms-1 text-[10px]">{isAr ? "منتهي" : "Expired"}</Badge>}
                </div>
              </div>
              {q.valid_until && (
                <p className="text-xs text-muted-foreground mt-2">
                  {isAr ? "صالح حتى" : "Valid until"}: {format(parseISO(q.valid_until), "MMM d, yyyy", { locale: lang === "ar" ? ar : enUS })}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => setViewQuote(q)}>{isAr ? "عرض التفاصيل" : "View Quote"}</Button>
                {q.status === "sent" && !expired && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setApproveQuoteId(q.id)} disabled={saving}>
                      <CheckCircle2 className="h-3.5 w-3.5 me-1" />{isAr ? "قبول" : "Approve"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setViewQuote(q); setFeedbackOpen(true); }}>
                      {isAr ? "طلب تعديل" : "Request Changes"}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quote Detail Dialog */}
      <Dialog open={!!viewQuote && !feedbackOpen} onOpenChange={() => setViewQuote(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {viewQuote && (
            <>
              <DialogHeader>
                <DialogTitle>{viewQuote.title}</DialogTitle>
                <p className="text-sm text-muted-foreground font-mono">{viewQuote.quote_number}</p>
              </DialogHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الوصف" : "Description"}</TableHead>
                    <TableHead className="text-end">{isAr ? "الساعات" : "Hours"}</TableHead>
                    <TableHead className="text-end">{isAr ? "السعر" : "Rate"}</TableHead>
                    <TableHead className="text-end">{isAr ? "الإجمالي" : "Total"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(viewQuote.line_items as any[])?.map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-end">{item.hours}</TableCell>
                      <TableCell className="text-end">{fmtCurrency(item.rate, lang)}</TableCell>
                      <TableCell className="text-end font-medium">{fmtCurrency(item.total, lang)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "المجموع الفرعي" : "Subtotal"}</span><span>{fmtCurrency(viewQuote.subtotal_usd, lang)}</span></div>
                {viewQuote.discount_pct > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "خصم" : "Discount"} ({viewQuote.discount_pct}%)</span><span className="text-green-600">-{fmtCurrency(viewQuote.subtotal_usd * viewQuote.discount_pct / 100, lang)}</span></div>}
                {viewQuote.tax_pct > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? "ضريبة" : "Tax"} ({viewQuote.tax_pct}%)</span><span>{fmtCurrency((viewQuote.subtotal_usd - viewQuote.subtotal_usd * (viewQuote.discount_pct || 0) / 100) * viewQuote.tax_pct / 100, lang)}</span></div>}
                <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>{isAr ? "الإجمالي" : "Total"}</span><span>{fmtCurrency(viewQuote.total_usd, lang)}</span></div>
              </div>
              {viewQuote.payment_terms && <div><p className="text-xs font-medium text-muted-foreground">{isAr ? "شروط الدفع" : "Payment Terms"}</p><p className="text-sm">{viewQuote.payment_terms}</p></div>}
              {viewQuote.estimated_duration && <div><p className="text-xs font-medium text-muted-foreground">{isAr ? "المدة المقدرة" : "Duration"}</p><p className="text-sm">{viewQuote.estimated_duration}</p></div>}
              {viewQuote.notes && <div><p className="text-xs font-medium text-muted-foreground">{isAr ? "ملاحظات" : "Notes"}</p><p className="text-sm">{viewQuote.notes}</p></div>}
              {viewQuote.status === "sent" && (
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setFeedbackOpen(true)}>{isAr ? "طلب تعديل" : "Request Changes"}</Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setApproveQuoteId(viewQuote.id)} disabled={saving}>
                    <CheckCircle2 className="h-4 w-4 me-1" />{isAr ? "قبول العرض" : "Approve Quote"}
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={(o) => { setFeedbackOpen(o); if (!o) setFeedback(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isAr ? "طلب تعديلات" : "Request Changes"}</DialogTitle></DialogHeader>
          <Textarea placeholder={isAr ? "ما التعديلات المطلوبة؟" : "What changes would you like?"} value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => viewQuote && handleReject(viewQuote)} disabled={saving}>{saving ? "..." : isAr ? "إرسال" : "Send"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={!!approveQuoteId} onOpenChange={(o) => { if (!o) setApproveQuoteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isAr ? "تأكيد الموافقة" : "Confirm Approval"}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{isAr ? "بالموافقة، أنت توافق على شروط العرض المقدم." : "By approving, you agree to the quoted terms."}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveQuoteId(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={saving} onClick={() => { const q = quotes.find((x: any) => x.id === approveQuoteId); if (q) handleApprove(q); }}>
              {saving ? "..." : isAr ? "موافقة" : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Active Projects Section ─── */
function ProjectsSection({ projects, isAr, lang }: { projects: any[]; isAr: boolean; lang: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {projects.map((p) => {
        const isOpen = expandedId === p.id;
        const ps = PROJECT_STATUS[p.status] || PROJECT_STATUS.planning;
        const overdue = p.target_end_date && isPast(parseISO(p.target_end_date)) && !["completed", "cancelled"].includes(p.status);

        return (
          <Card key={p.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Link to={`/my-projects/${p.id}`} className="font-bold hover:underline">{p.title}</Link>
                  <Badge className={cn(ps.color)}>{isAr ? ps.ar : ps.en}</Badge>
                  {overdue && <Badge variant="destructive" className="text-xs">{isAr ? "متأخر" : "Overdue"}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.start_date ? format(parseISO(p.start_date), "MMM d", { locale: lang === "ar" ? ar : enUS }) : "—"} → {p.target_end_date ? format(parseISO(p.target_end_date), "MMM d, yyyy", { locale: lang === "ar" ? ar : enUS }) : "—"}
                </p>
              </div>
              <div className="text-end shrink-0">
                <div className="text-sm font-bold">{fmtCurrency(p.total_budget_usd, lang)}</div>
                {p.paid_usd > 0 && <div className="text-xs text-muted-foreground">{isAr ? "المدفوع" : "Paid"}: {fmtCurrency(p.paid_usd, lang)}</div>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Progress value={p.progress_pct || 0} className="h-2 flex-1" />
              <span className="text-sm font-bold w-10 text-end">{p.progress_pct || 0}%</span>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setExpandedId(isOpen ? null : p.id)} className="gap-1 text-xs">
                {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {isAr ? "التحديثات" : "View Updates"}
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs">
                <Link to={`/my-projects/${p.id}`}>{isAr ? "عرض المشروع" : "View Project"}</Link>
              </Button>
            </div>

            {isOpen && <ProjectUpdatesInline projectId={p.id} isAr={isAr} lang={lang} />}
          </Card>
        );
      })}
    </div>
  );
}

function ProjectUpdatesInline({ projectId, isAr, lang }: { projectId: string; isAr: boolean; lang: string }) {
  const { data: updates = [], isLoading } = useQuery({
    queryKey: ["my-project-updates", projectId],
    staleTime: 60000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_updates")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_visible_to_client", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>;
  if (updates.length === 0) return <p className="text-sm text-muted-foreground">{isAr ? "لا توجد تحديثات بعد" : "No updates yet"}</p>;

  return (
    <div className="border-t pt-3 space-y-3 animate-fade-in">
      {updates.map((u: any) => {
        const Icon = UPDATE_ICONS[u.type] || MessageSquare;
        return (
          <div key={u.id} className="flex gap-2.5">
            <div className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
              u.type === "milestone" ? "bg-amber-500/15 text-amber-600" :
              u.type === "deliverable" ? "bg-green-500/15 text-green-600" :
              u.type === "issue" ? "bg-red-500/15 text-red-600" :
              "bg-blue-500/15 text-blue-600"
            )}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{u.title}</p>
              {u.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{u.body}</p>}
              <p className="text-[10px] text-muted-foreground mt-1">{format(parseISO(u.created_at), "MMM d, yyyy · h:mm a", { locale: lang === "ar" ? ar : enUS })}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
