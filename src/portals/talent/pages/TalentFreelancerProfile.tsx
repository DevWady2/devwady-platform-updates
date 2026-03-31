/**
 * Talent — Freelancer Profile management.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/core/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import {
  MapPin, Star, Mail, Phone,
  Github, Linkedin, ExternalLink, Edit,
} from "lucide-react";

export default function TalentFreelancerProfile() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const { data: profile, isLoading } = useQuery({
    queryKey: ["talent-freelancer-full-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="h-60 bg-muted rounded-lg animate-pulse" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title_en="My Talent Profile"
        title_ar="ملفي كموهبة"
        description_en="Manage how companies see your profile"
        description_ar="أدر كيف تظهر للشركات"
        actions={
          <Link to="/profile/edit">
            <Button size="sm"><Edit className="h-4 w-4 me-1.5" />{isAr ? "تعديل" : "Edit Profile"}</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url ?? ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {(profile?.full_name ?? "?")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">{profile?.full_name ?? "—"}</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                {profile?.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>}
                {profile?.rating && <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" />{profile.rating}</span>}
                <Badge variant={profile?.is_available ? "default" : "secondary"}>
                  {profile?.is_available ? (isAr ? "متاح للعمل" : "Available") : (isAr ? "غير متاح" : "Not Available")}
                </Badge>
              </div>
              {profile?.hourly_rate && (
                <p className="text-sm font-medium text-primary mt-1">{profile.hourly_rate}/hr</p>
              )}
            </div>
          </div>

          {profile?.bio && <p className="text-sm text-muted-foreground mt-4">{profile.bio}</p>}

          <div className="flex flex-wrap gap-3 mt-4">
            {profile?.github_url && (
              <a href={profile.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Github className="h-3.5 w-3.5" />GitHub
              </a>
            )}
            {profile?.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Linkedin className="h-3.5 w-3.5" />LinkedIn
              </a>
            )}
            {profile?.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-3.5 w-3.5" />Portfolio
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{isAr ? "المهارات" : "Skills"}</CardTitle></CardHeader>
        <CardContent>
          {profile?.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{isAr ? "لم تُضف مهارات بعد" : "No skills added yet"}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{isAr ? "معلومات التواصل" : "Contact Info"}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{user?.email}</span>
          </div>
          {profile?.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{profile.phone}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
