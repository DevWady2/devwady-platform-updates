/**
 * Backoffice — Organization / Company Management.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, SearchFilterBar, EmptyState } from "@/core/components";
import { useSearch } from "@/core/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, MapPin, Users, ExternalLink } from "lucide-react";
import { ACCOUNT_STATUS_COLORS, formatStatus } from "../constants";

interface CompanyRow {
  id: string;
  company_name: string;
  logo_url: string | null;
  industry: string | null;
  location: string | null;
  employee_count: string | null;
  is_verified: boolean | null;
  slug: string | null;
  created_at: string;
  owner_name: string | null;
  owner_status: string;
}

export default function BackofficeOrganizations() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const search = useSearch();
  const [tab, setTab] = useState("all");

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["bo-companies"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: companyData, error } = await supabase
        .from("company_profiles")
        .select("id, company_name, logo_url, industry, location, employee_count, is_verified, slug, created_at, user_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!companyData?.length) return [] as CompanyRow[];

      const userIds = companyData.map((c) => c.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, account_status")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, p])
      );

      return companyData.map((c): CompanyRow => {
        const profile = profileMap.get(c.user_id);
        return {
          id: c.id,
          company_name: c.company_name,
          logo_url: c.logo_url,
          industry: c.industry,
          location: c.location,
          employee_count: c.employee_count,
          is_verified: c.is_verified,
          slug: c.slug,
          created_at: c.created_at,
          owner_name: profile?.full_name ?? null,
          owner_status: profile?.account_status ?? "active",
        };
      });
    },
  });

  const filtered = companies
    .filter((c) => {
      if (tab === "verified") return c.is_verified;
      if (tab === "pending") return c.owner_status === "pending_approval";
      return true;
    })
    .filter((c) => {
      if (!search.params.query) return true;
      const q = search.params.query.toLowerCase();
      return c.company_name.toLowerCase().includes(q) || (c.industry ?? "").toLowerCase().includes(q);
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Organizations"
        title_ar="المؤسسات"
        description_en="Manage company accounts and profiles"
        description_ar="إدارة حسابات الشركات وملفاتها"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">{isAr ? "الكل" : "All"} ({companies.length})</TabsTrigger>
          <TabsTrigger value="verified">{isAr ? "موثقة" : "Verified"}</TabsTrigger>
          <TabsTrigger value="pending">{isAr ? "تنتظر الموافقة" : "Pending"}</TabsTrigger>
        </TabsList>
      </Tabs>

      <SearchFilterBar
        query={search.params.query ?? ""}
        onQueryChange={search.setQuery}
        placeholder_en="Search companies..."
        placeholder_ar="بحث عن شركات..."
      />

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title_en="No organizations found"
          title_ar="لا توجد مؤسسات"
          description_en="Company accounts will appear here"
          description_ar="ستظهر حسابات الشركات هنا"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12 rounded-xl">
                  {c.logo_url ? <AvatarImage src={c.logo_url} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold rounded-xl">
                    {c.company_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold truncate">{c.company_name}</h3>
                    {c.is_verified && (
                      <Badge variant="secondary" className="text-[10px] bg-success/10 text-success">
                        {isAr ? "موثقة" : "Verified"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    {c.industry && <span>{c.industry}</span>}
                    {c.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.location}</span>}
                    {c.employee_count && <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{c.employee_count}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-[10px] ${ACCOUNT_STATUS_COLORS[c.owner_status] ?? ""}`}>
                    {formatStatus(c.owner_status)}
                  </Badge>
                  {c.slug && (
                    <a href={`/companies/${c.slug}`} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
