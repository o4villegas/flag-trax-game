import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Loading skeleton for stats cards (3-column grid)
 */
export function StatsCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for flag lists
 */
export function FlagListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-4 w-full mt-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for tables
 */
export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Table header */}
      <div className="border-b pb-2">
        <Skeleton className="h-8 w-full" />
      </div>
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/**
 * Loading skeleton for flag detail page
 */
export function FlagDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Main flag info card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capture action card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      {/* History card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <FlagListSkeleton count={2} />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Loading skeleton for request cards
 */
export function RequestListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-3 border border-border rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Generic content skeleton
 */
export function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}
