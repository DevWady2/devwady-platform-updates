/**
 * Backoffice — Account Types & Capabilities Overview.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, SearchFilterBar, EmptyState } from "@/core/components";
import { useSearch } from "@/core/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Sparkles } from "lucide-react";
import { getAccountTypeLabel, normalizeAccountType, type AccountType } from "@/core/types";

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  account_type: AccountType | null;
  capabilities: string[] | null;
}

const ACCOUNT_TYPES: AccountType[] = ["admin", "company", "freelancer", "expert", "student", "instructor"];

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  admin: "bg-destructive/10 text-destructive",
  company: "bg-primary/10 text-primary",
  freelancer: "bg-emerald-500/10 text-emerald-600",
  expert: "bg-purple-500/10 text-purple-600",
  student: "bg-cyan-500/10 text-cyan-600",
  instructor: "bg-amber-500/10 text-amber-600",
};

export default function BackofficeRoles() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const search = useSearch();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["bo-account-types"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, account_type, capabilities")
        .not("account_type", "is", null)
        .order("full_name");
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        account_type: normalizeAccountType(row.account_type),
        capabilities: Array.isArray(row.capabilities) ? row.capabilities : [],
      })) as ProfileRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = (search.params.query ?? "").trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((profile) => {
      const label = getAccountTypeLabel(profile.account_type, isAr ? "ar" : "en")?.toLowerCase() ?? "";
      const name = (profile.full_name ?? "").toLowerCase();
      return name.includes(q) || label.includes(q);
    });
  }, [profiles, search.params.query, isAr]);

  const counts = useMemo(() => ACCOUNT_TYPES.map((accountType) => ({
    accountType,
    count: profiles.filter((profile) => profile.account_type === accountType).length,
  })), [profiles]);

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Account Types & Capabilities"
        title_ar="أنواع الحسابات والقدرات"
        description_en="Review canonical account identity and capability assignments across the platform"
        description_ar="راجع نوع الحساب والقدرات المعتمدة عبر المنصة"
      />

      <div className="flex flex-wrap gap-2">
        {counts.map(({ accountType, count }) => (
          <Badge key={accountType} variant="secondary" className={`text-xs py-1.5 px-3 ${ACCOUNT_TYPE_COLORS[accountType]}`}>
            {getAccountTypeLabel(accountType, isAr ? "ar" : "en")}: {count}
          </Badge>
        ))}
      </div>

      <SearchFilterBar
        query={search.params.query ?? ""}
        onQueryChange={search.setQuery}
        placeholder_en="Search account types..."
        placeholder_ar="ابحث في أنواع الحسابات..."
      />

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-12 w-12" />}
          title_en="No canonical account types"
          title_ar="لا توجد أنواع حسابات معتمدة"
          description_en="Users with a canonical account type will appear here"
          description_ar="سيظهر هنا المستخدمون الذين لديهم نوع حساب معتمد"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((profile) => (
            <Card key={profile.user_id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {(profile.full_name ?? "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile.full_name ?? (isAr ? "مستخدم بدون اسم" : "Unnamed user")}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {profile.account_type && (
                        <Badge variant="secondary" className={`text-[10px] ${ACCOUNT_TYPE_COLORS[profile.account_type]}`}>
                          {getAccountTypeLabel(profile.account_type, isAr ? "ar" : "en")}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        {profile.capabilities?.length ?? 0} {isAr ? "قدرة" : "capabilities"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
