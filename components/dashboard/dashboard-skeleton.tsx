import { cn } from "@/lib/utils";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card shadow-sm p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-5 w-5 rounded" />
          <div className="space-y-1.5">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-3 w-48" />
          </div>
        </div>
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>

      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-2 w-2 rounded-full" />
        <SkeletonBlock className="h-3 w-24" />
      </div>

      <div className="flex gap-3">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-3 w-24" />
      </div>

      <div className="flex gap-1.5">
        <SkeletonBlock className="h-5 w-12 rounded-md" />
        <SkeletonBlock className="h-5 w-14 rounded-md" />
        <SkeletonBlock className="h-5 w-10 rounded-md" />
      </div>

      <div className="flex items-center justify-between pt-1">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="h-4 w-4 rounded" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-40" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <SkeletonBlock className="h-9 w-36 rounded-md" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </div>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <SkeletonBlock className="h-8 w-8 rounded-md" />
          <div className="space-y-2">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-4 w-64" />
          </div>
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-8 w-20 rounded-md" />
          <SkeletonBlock className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <SkeletonBlock className="h-10 w-80 rounded-md" />

      {/* Content area */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-4 w-1/2" />
        </div>
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}
