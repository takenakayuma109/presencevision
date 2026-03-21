"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@/components/ui";
import {
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

interface ContentVersion {
  id: string;
  version: number;
  body: string;
  createdAt: string;
}

interface ContentAsset {
  id: string;
  title: string;
  slug: string | null;
  type: string;
  status: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string };
  entity: { id: string; name: string } | null;
  versions: ContentVersion[];
  approvalRequests: {
    id: string;
    status: string;
    createdAt: string;
    requester: { id: string; name: string | null; email: string };
  }[];
}

interface ContentResponse {
  assets: ContentAsset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ContentModerationPage() {
  const [data, setData] = useState<ContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/content?page=${page}&limit=20`
      );
      if (!res.ok) throw new Error("Failed to fetch content");
      const json: ContentResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  async function handleAction(assetId: string, action: "approve" | "reject") {
    setActionLoading(assetId);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId, action }),
      });
      if (!res.ok) throw new Error("Action failed");
      // Remove the item from the list
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          assets: prev.assets.filter((a) => a.id !== assetId),
          total: prev.total - 1,
        };
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Moderation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve pending content
          {data ? ` (${data.total} pending)` : ""}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading content...
          </span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-red-600">
            {error}
          </CardContent>
        </Card>
      ) : !data || data.assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No content pending review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.assets.map((asset) => {
            const latestVersion = asset.versions[0];
            const requester = asset.approvalRequests[0]?.requester;
            const isExpanded = expandedId === asset.id;
            const isActioning = actionLoading === asset.id;

            return (
              <Card key={asset.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">
                        {asset.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {asset.type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {asset.project.name}
                        </Badge>
                        {asset.entity && (
                          <Badge variant="outline" className="text-[10px]">
                            {asset.entity.name}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          v{latestVersion?.version ?? 1}
                        </span>
                      </div>
                      {requester && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Requested by{" "}
                          {requester.name ?? requester.email}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isActioning}
                        onClick={() => handleAction(asset.id, "reject")}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {isActioning ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                        <span className="ml-1.5">Reject</span>
                      </Button>
                      <Button
                        size="sm"
                        disabled={isActioning}
                        onClick={() => handleAction(asset.id, "approve")}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isActioning ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        <span className="ml-1.5">Approve</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {latestVersion && (
                  <CardContent className="pt-0">
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : asset.id)
                      }
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? "Hide preview" : "Show preview"}
                    </button>
                    {isExpanded && (
                      <div className="mt-3 rounded-md border bg-muted/30 p-4 text-sm leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                        {latestVersion.body.slice(0, 2000)}
                        {latestVersion.body.length > 2000 && "..."}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between px-1 py-3">
              <p className="text-xs text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
