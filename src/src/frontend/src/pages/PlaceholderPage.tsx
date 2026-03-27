import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
  ocid?: string;
}

export function PlaceholderPage({
  title,
  subtitle,
  ocid,
}: PlaceholderPageProps) {
  return (
    <div
      className="flex items-center justify-center min-h-[60vh] animate-fade-in"
      data-ocid={ocid ? `${ocid}.page` : undefined}
    >
      <Card className="shadow-card border-border/50 max-w-md w-full text-center">
        <CardContent className="pt-12 pb-12 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Construction className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Dolazi uskoro</p>
        </CardContent>
      </Card>
    </div>
  );
}
