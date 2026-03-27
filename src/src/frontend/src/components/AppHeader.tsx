import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { UserRole } from "../backend.d";
import { useCallerProfile, useCallerRole } from "../hooks/useQueries";

function roleLabel(role: UserRole | undefined): string {
  if (role === UserRole.admin) return "Administrator";
  if (role === UserRole.user) return "Korisnik";
  return "";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AppHeader() {
  const { data: profile } = useCallerProfile();
  const { data: role } = useCallerRole();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-end px-6 gap-4 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground relative"
        data-ocid="header.notifications.button"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal rounded-full" />
      </Button>

      <div className="flex items-center gap-3" data-ocid="header.user.panel">
        {role && role !== UserRole.guest && (
          <Badge
            variant="secondary"
            className="text-xs font-medium bg-accent text-teal border-0"
            data-ocid="header.role.badge"
          >
            {roleLabel(role)}
          </Badge>
        )}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {profile?.name ?? "Korisnik"}
          </p>
        </div>
        <Avatar className="h-9 w-9 border-2 border-teal/30">
          <AvatarFallback className="bg-teal/10 text-teal text-xs font-bold">
            {profile?.name ? getInitials(profile.name) : "KO"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
