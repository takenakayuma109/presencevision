"use client";

import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const mockEntities = [
  { id: "1", name: "PresenceVision", type: "Organization", contentCount: 12, mentions: 45, updated: new Date(Date.now() - 3600000) },
  { id: "2", name: "Digital Presence", type: "Concept", contentCount: 8, mentions: 32, updated: new Date(Date.now() - 86400000) },
  { id: "3", name: "AEO", type: "Concept", contentCount: 5, mentions: 18, updated: new Date(Date.now() - 172800000) },
  { id: "4", name: "Answer Engine", type: "Technology", contentCount: 3, mentions: 9, updated: new Date(Date.now() - 259200000) },
  { id: "5", name: "GEO", type: "Concept", contentCount: 4, mentions: 12, updated: new Date(Date.now() - 432000000) },
];

export default function EntitiesPage() {
  const t = useT();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("entities.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("entities.subtitle")}</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t("entities.add")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("entities.all")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("entities.name")}</TableHead>
                <TableHead>{t("entities.type")}</TableHead>
                <TableHead>{t("entities.contentCount")}</TableHead>
                <TableHead>{t("entities.mentions")}</TableHead>
                <TableHead>{t("entities.updated")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEntities.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{e.type}</TableCell>
                  <TableCell>{e.contentCount}</TableCell>
                  <TableCell>{e.mentions}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(e.updated)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
