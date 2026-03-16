"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Textarea,
} from "@/components/ui";
import { Search, ChevronDown, ChevronUp, Check, X } from "lucide-react";

type ReviewStatus = "pending" | "verified" | "rejected";

interface CheckItem {
  label: string;
  key: string;
  checked: boolean;
}

interface EntityReview {
  id: string;
  projectName: string;
  url: string;
  userEmail: string;
  submittedAt: string;
  status: ReviewStatus;
  checks: CheckItem[];
  notes: string;
}

const initialReviews: EntityReview[] = [
  {
    id: "1",
    projectName: "株式会社ABC",
    url: "https://abc-corp.jp",
    userEmail: "tanaka@abc-corp.jp",
    submittedAt: "2026-03-15",
    status: "pending",
    checks: [
      { label: "法人確認", key: "corporate", checked: false },
      { label: "公式サイト確認", key: "website", checked: false },
      { label: "実在サービス確認", key: "service", checked: false },
      { label: "ドメイン所有確認", key: "domain", checked: false },
    ],
    notes: "",
  },
  {
    id: "2",
    projectName: "XYZ Technologies",
    url: "https://xyz-tech.com",
    userEmail: "admin@xyz-tech.com",
    submittedAt: "2026-03-14",
    status: "pending",
    checks: [
      { label: "法人確認", key: "corporate", checked: false },
      { label: "公式サイト確認", key: "website", checked: false },
      { label: "実在サービス確認", key: "service", checked: false },
      { label: "ドメイン所有確認", key: "domain", checked: false },
    ],
    notes: "",
  },
  {
    id: "3",
    projectName: "有限会社ヤマダ商店",
    url: "https://yamada-shop.jp",
    userEmail: "info@yamada-shop.jp",
    submittedAt: "2026-03-13",
    status: "pending",
    checks: [
      { label: "法人確認", key: "corporate", checked: false },
      { label: "公式サイト確認", key: "website", checked: false },
      { label: "実在サービス確認", key: "service", checked: false },
      { label: "ドメイン所有確認", key: "domain", checked: false },
    ],
    notes: "",
  },
  {
    id: "4",
    projectName: "Global Solutions Inc.",
    url: "https://global-solutions.io",
    userEmail: "contact@global-solutions.io",
    submittedAt: "2026-03-10",
    status: "verified",
    checks: [
      { label: "法人確認", key: "corporate", checked: true },
      { label: "公式サイト確認", key: "website", checked: true },
      { label: "実在サービス確認", key: "service", checked: true },
      { label: "ドメイン所有確認", key: "domain", checked: true },
    ],
    notes: "All checks passed. Verified via national registry.",
  },
  {
    id: "5",
    projectName: "Fake Store 999",
    url: "https://fake-store-999.xyz",
    userEmail: "spam@random.net",
    submittedAt: "2026-03-09",
    status: "rejected",
    checks: [
      { label: "法人確認", key: "corporate", checked: false },
      { label: "公式サイト確認", key: "website", checked: false },
      { label: "実在サービス確認", key: "service", checked: false },
      { label: "ドメイン所有確認", key: "domain", checked: false },
    ],
    notes: "No corporate registration found. Website appears fraudulent.",
  },
];

const statusBadge: Record<ReviewStatus, { variant: "warning" | "success" | "destructive"; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  verified: { variant: "success", label: "Verified" },
  rejected: { variant: "destructive", label: "Rejected" },
};

const tabs: { key: ReviewStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
];

export default function EntityReviewsPage() {
  const [reviews, setReviews] = useState<EntityReview[]>(initialReviews);
  const [activeTab, setActiveTab] = useState<ReviewStatus | "all">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = reviews.filter((r) => {
    const matchTab = activeTab === "all" || r.status === activeTab;
    const matchSearch =
      !search ||
      r.projectName.toLowerCase().includes(search.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      r.url.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const toggleCheck = (reviewId: string, checkKey: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              checks: r.checks.map((c) =>
                c.key === checkKey ? { ...c, checked: !c.checked } : c,
              ),
            }
          : r,
      ),
    );
  };

  const updateNotes = (reviewId: string, notes: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, notes } : r)),
    );
  };

  const setStatus = (reviewId: string, status: ReviewStatus) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, status } : r)),
    );
    setExpandedId(null);
  };

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Entity Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and verify entity submissions ({pendingCount} pending)
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or URL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => {
          const count = tab.key === "all"
            ? reviews.length
            : reviews.filter((r) => r.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-muted-foreground">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Review List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No reviews found.
          </div>
        )}
        {filtered.map((review) => {
          const isExpanded = expandedId === review.id;
          const badge = statusBadge[review.status];
          return (
            <Card key={review.id}>
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : review.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{review.projectName}</p>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      <span>{review.url}</span>
                      <span>{review.userEmail}</span>
                      <span>Submitted: {review.submittedAt}</span>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>

              {isExpanded && (
                <CardContent className="border-t pt-4 space-y-4">
                  {/* Verification Checks */}
                  <div>
                    <p className="text-sm font-medium mb-3">Verification Checks</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {review.checks.map((check) => (
                        <button
                          key={check.key}
                          onClick={() => toggleCheck(review.id, check.key)}
                          className={`flex items-center gap-3 rounded-md border p-3 text-sm transition-colors ${
                            check.checked
                              ? "border-green-500/50 bg-green-50 dark:bg-green-950/30"
                              : "border-border hover:border-foreground/20"
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                              check.checked
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {check.checked && <Check className="h-3 w-3" />}
                          </div>
                          <span>{check.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <p className="text-sm font-medium mb-2">Notes</p>
                    <Textarea
                      placeholder="Add review notes..."
                      value={review.notes}
                      onChange={(e) => updateNotes(review.id, e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    {review.status !== "rejected" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setStatus(review.id, "rejected")}
                        className="gap-1.5"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    )}
                    {review.status !== "verified" && (
                      <Button
                        size="sm"
                        onClick={() => setStatus(review.id, "verified")}
                        className="gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
