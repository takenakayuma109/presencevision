"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ArrowLeft, BarChart3, Box, FileText } from "lucide-react";
import Link from "next/link";

const mockProject = {
  id: "1",
  name: "Digital Presence Guide",
  description: "Comprehensive guide to digital presence optimization for AEO and GEO.",
  entities: 12,
  topics: 24,
  content: 18,
};

const mockEntities = [
  { id: "1", name: "PresenceVision", type: "Organization", status: "Active" },
  { id: "2", name: "Digital Presence", type: "Concept", status: "Active" },
  { id: "3", name: "AEO", type: "Concept", status: "Active" },
  { id: "4", name: "GEO", type: "Concept", status: "Active" },
  { id: "5", name: "Answer Engine", type: "Technology", status: "Active" },
];

const mockTopics = [
  { id: "1", title: "What is Digital Presence?", intent: "Informational", status: "completed", cluster: "Core" },
  { id: "2", title: "AEO vs SEO comparison", intent: "Comparison", status: "in_progress", cluster: "Strategy" },
  { id: "3", title: "How to optimize for GEO", intent: "How-to", status: "backlog", cluster: "Tactics" },
  { id: "4", title: "Entity-based content strategy", intent: "Informational", status: "completed", cluster: "Core" },
  { id: "5", title: "LLM citation best practices", intent: "How-to", status: "backlog", cluster: "Tactics" },
];

type Tab = "overview" | "entities" | "topics";

const statusVariant: Record<string, "secondary" | "warning" | "success"> = {
  backlog: "secondary",
  in_progress: "warning",
  completed: "success",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold">{mockProject.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">{mockProject.description}</p>
      </div>

      <div className="flex gap-2 border-b">
        {(["overview", "entities", "topics"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entities</span>
                  <span className="font-medium">{mockProject.entities}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Topics</span>
                  <span className="font-medium">{mockProject.topics}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Content</span>
                  <span className="font-medium">{mockProject.content}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "entities" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEntities.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.type}</TableCell>
                    <TableCell><Badge variant="success">{e.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "topics" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead>Cluster</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTopics.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>{t.intent}</TableCell>
                    <TableCell>{t.cluster}</TableCell>
                    <TableCell><Badge variant={statusVariant[t.status]}>{t.status.replace("_", " ")}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
