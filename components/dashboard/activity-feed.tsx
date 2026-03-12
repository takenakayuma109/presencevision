"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { ActivityItem } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { useT } from "@/lib/i18n";

interface ActivityFeedProps {
  items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  const t = useT();
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{t("dashboard.recentActivity")}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-info shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{item.action}</span>{" "}
                    <span className="text-muted-foreground">{item.resource}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("common.noActivity")}</p>
        )}
      </CardContent>
    </Card>
  );
}
