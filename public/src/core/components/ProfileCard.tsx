/**
 * ProfileCard — Compact user profile card for use across portals.
 */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, Briefcase } from "lucide-react";
import type { Profile } from "@/core/types";

interface Props {
  profile: Profile;
  role?: string;
  compact?: boolean;
  onClick?: () => void;
}

const roleBadgeColors: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive",
  company: "bg-blue-500/10 text-blue-600",
  individual: "bg-success/10 text-success",
  expert: "bg-primary/10 text-primary",
  instructor: "bg-warning/10 text-warning",
  student: "bg-teal-500/10 text-teal-600",
};

export default function ProfileCard({ profile, role, compact, onClick }: Props) {
  const initials = (profile.full_name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={onClick}
      >
        <Avatar className="h-9 w-9">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{profile.full_name ?? "User"}</p>
          {profile.track && (
            <p className="text-xs text-muted-foreground truncate">{profile.track}</p>
          )}
        </div>
        {role && (
          <Badge variant="secondary" className={`text-[10px] ${roleBadgeColors[role] ?? ""}`}>
            {role}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{profile.full_name ?? "User"}</h3>
              {role && (
                <Badge variant="secondary" className={`text-[10px] ${roleBadgeColors[role] ?? ""}`}>
                  {role}
                </Badge>
              )}
            </div>
            {profile.track && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <Briefcase className="h-3.5 w-3.5" />
                <span className="truncate">{profile.track}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                <span>{profile.location}</span>
              </div>
            )}
            <div className="flex items-center gap-3 mt-2">
              {profile.rating != null && profile.rating > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 text-warning fill-warning" />
                  <span>{profile.rating}</span>
                </div>
              )}
              {profile.skills && profile.skills.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {profile.skills.slice(0, 3).map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px] h-5">
                      {s}
                    </Badge>
                  ))}
                  {profile.skills.length > 3 && (
                    <Badge variant="outline" className="text-[10px] h-5">
                      +{profile.skills.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
