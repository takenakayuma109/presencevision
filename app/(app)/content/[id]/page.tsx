"use client";

import { useParams } from "next/navigation";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Download, Send } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const mockContent = {
  id: "1",
  title: "Digital Presence Guide - Complete Overview",
  status: "REVIEW",
  versions: [
    { id: "v1", created: new Date(Date.now() - 86400000), author: "admin" },
    { id: "v2", created: new Date(Date.now() - 3600000), author: "admin" },
  ],
  evidence: [
    { id: "1", type: "Source", text: "Google SGE - Digital presence definition", url: "#" },
    { id: "2", type: "Entity", text: "PresenceVision - Company overview", url: "#" },
  ],
  markdown: `# Digital Presence Guide

## What is Digital Presence?

Digital presence refers to how your brand appears across online channels—search engines, AI assistants, and knowledge panels.

## Key Components

1. **Entity Coverage** - How well your brand entities are represented
2. **Content Quality** - Authoritative, well-structured content
3. **Citation Signals** - Backlinks and mentions that support authority

## Best Practices

- Maintain consistent NAP (Name, Address, Phone) across the web
- Create entity-focused content that answers common questions
- Optimize for answer engines (AEO) and generative search (GEO)
`,
};

export default function ContentDetailPage() {
  const params = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{mockContent.title}</h2>
          <Badge variant="warning" className="mt-1">{mockContent.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Markdown
          </Button>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Submit for Approval
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Markdown Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md overflow-x-auto">{mockContent.markdown}</pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Version History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockContent.versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                    <span className="font-medium">{v.id}</span>
                    <span className="text-muted-foreground">{formatDateTime(v.created)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evidence Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockContent.evidence.map((e) => (
                  <div key={e.id} className="py-2 border-b last:border-0">
                    <Badge variant="secondary" className="mb-1">{e.type}</Badge>
                    <p className="text-sm">{e.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
