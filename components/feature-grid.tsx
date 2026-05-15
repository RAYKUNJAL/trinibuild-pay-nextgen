import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function FeatureGrid({ items }: { items: FeatureItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ icon: Icon, title, description }) => (
        <Card key={title} className="border-border/60">
          <CardContent className="p-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-red/10 text-brand-red">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="mt-4 text-base font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
