/**
 * Backoffice — Roles & Permissions Management.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader, SearchFilterBar, EmptyState } from "@/core/components";
import { useSearch } from "@/core/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AVAILABLE_ROLES = ["admin", "individual", "company", "expert", "student", "instructor"] as const;

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive",
  individual: "bg-primary/10 text-primary",
  company: "bg-accent/20 text-accent-foreground",
  expert: "bg-primary/15 text-primary",
  student: "bg-warning/10 text-warning",
  instructor: "bg-success/10 text-success",
};

interface UserRoleRow {
  id: string;
  user_id: string;
  role: string;
}

interface ProfileRow {
  user_id: string;
  full_name: string | null;
}

interface UserWithRoles {
  userId: string;
  name: string;
  roles: { id: string; role: string }[];
}

function buildUserList(userRoles: UserRoleRow[], profiles: ProfileRow[], query: string): UserWithRoles[] {
  const map = new Map<string, UserWithRoles>();
  userRoles.forEach((ur) => {
    if (!map.has(ur.user_id)) {
      const profile = profiles.find((p) => p.user_id === ur.user_id);
      map.set(ur.user_id, { userId: ur.user_id, name: profile?.full_name ?? "Unknown", roles: [] });
    }
    map.get(ur.user_id)!.roles.push({ id: ur.id, role: ur.role });
  });
  const list = Array.from(map.values());
  if (!query) return list;
  const q = query.toLowerCase();
  return list.filter((u) => u.name.toLowerCase().includes(q));
}

export default function BackofficeRoles() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const search = useSearch();
  const qc = useQueryClient();
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");

  const { data: userRoles = [], isLoading } = useQuery({
    queryKey: ["bo-user-roles"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role")
        .order("role");
      if (error) throw error;
      return (data ?? []) as UserRoleRow[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["bo-role-profiles"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return (data ?? []) as ProfileRow[];
    },
  });

  const users = buildUserList(userRoles, profiles, search.params.query ?? "");

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bo-user-roles"] });
      toast.success(isAr ? "تمت إضافة الدور" : "Role added");
      setAddingFor(null);
      setSelectedRole("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRole = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bo-user-roles"] });
      toast.success(isAr ? "تم حذف الدور" : "Role removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleCounts = AVAILABLE_ROLES.map((role) => ({
    role,
    count: userRoles.filter((ur) => ur.role === role).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="Roles & Permissions"
        title_ar="الأدوار والصلاحيات"
        description_en="Manage user roles across the platform"
        description_ar="إدارة أدوار المستخدمين عبر المنصة"
      />

      <div className="flex flex-wrap gap-2">
        {roleCounts.map((rc) => (
          <Badge key={rc.role} variant="secondary" className={`text-xs py-1.5 px-3 ${ROLE_COLORS[rc.role] ?? ""}`}>
            {rc.role}: {rc.count}
          </Badge>
        ))}
      </div>

      <SearchFilterBar
        query={search.params.query ?? ""}
        onQueryChange={search.setQuery}
        placeholder_en="Search users..."
        placeholder_ar="بحث عن مستخدمين..."
      />

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-12 w-12" />}
          title_en="No users with roles"
          title_ar="لا يوجد مستخدمون بأدوار"
          description_en="Assign roles to users to see them here"
          description_ar="عيّن أدوارًا للمستخدمين لرؤيتهم هنا"
        />
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <UserRoleCard
              key={u.userId}
              user={u}
              isAr={isAr}
              addingFor={addingFor}
              selectedRole={selectedRole}
              onStartAdd={(id) => { setAddingFor(id); setSelectedRole(""); }}
              onCancelAdd={() => setAddingFor(null)}
              onSelectRole={setSelectedRole}
              onAddRole={(userId, role) => addRole.mutate({ userId, role })}
              onRemoveRole={(roleId) => removeRole.mutate(roleId)}
              isAdding={addRole.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Sub-component ─── */
interface UserRoleCardProps {
  user: UserWithRoles;
  isAr: boolean;
  addingFor: string | null;
  selectedRole: string;
  onStartAdd: (userId: string) => void;
  onCancelAdd: () => void;
  onSelectRole: (role: string) => void;
  onAddRole: (userId: string, role: string) => void;
  onRemoveRole: (roleId: string) => void;
  isAdding: boolean;
}

function UserRoleCard({
  user, isAr, addingFor, selectedRole,
  onStartAdd, onCancelAdd, onSelectRole, onAddRole, onRemoveRole, isAdding,
}: UserRoleCardProps) {
  const isEditing = addingFor === user.userId;
  const availableRoles = AVAILABLE_ROLES.filter((r) => !user.roles.some((ur) => ur.role === r));

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {user.roles.map((r) => (
                <Badge key={r.id} variant="secondary" className={`text-[10px] gap-1 ${ROLE_COLORS[r.role] ?? ""}`}>
                  {r.role}
                  <button onClick={() => onRemoveRole(r.id)} className="hover:text-destructive transition-colors ms-0.5">
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <Select value={selectedRole} onValueChange={onSelectRole}>
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue placeholder={isAr ? "اختر دور" : "Select role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-8"
                  disabled={!selectedRole || isAdding}
                  onClick={() => onAddRole(user.userId, selectedRole)}
                >
                  {isAdding ? <Loader2 className="h-3 w-3 animate-spin" /> : isAr ? "إضافة" : "Add"}
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={onCancelAdd}>✕</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onStartAdd(user.userId)}>
                <Plus className="h-3 w-3 me-1" />{isAr ? "إضافة دور" : "Add Role"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
