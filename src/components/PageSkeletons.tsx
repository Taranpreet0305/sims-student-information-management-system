import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const DashboardSkeleton = () => (
  <div className="space-y-4 sm:space-y-6 w-full max-w-full">
    {/* Welcome banner */}
    <Skeleton className="h-24 sm:h-32 w-full rounded-xl" />
    
    {/* Stats grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-3 sm:p-4">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Quick links */}
    <div>
      <Skeleton className="h-5 w-24 mb-3" />
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-2 sm:p-4 flex flex-col items-center gap-2">
              <Skeleton className="h-8 w-8 sm:h-12 sm:w-12 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    {/* Profile card */}
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="flex-1">
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export const StatCardsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(count)].map((_, i) => (
      <Card key={i}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-16" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const ChartSkeleton = ({ title }: { title?: string }) => (
  <Card className="overflow-hidden">
    <CardHeader>
      <Skeleton className="h-5 w-40" />
      {title && <Skeleton className="h-3 w-56 mt-1" />}
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[200px] sm:h-[280px] w-full rounded-lg" />
    </CardContent>
  </Card>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-32" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex gap-4">
          {[...Array(cols)].map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4">
            {[...Array(cols)].map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const NoticesSkeleton = () => (
  <div className="space-y-3 sm:space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const TimetableSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="p-3 rounded-lg bg-muted/50 space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const PlacementsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {[...Array(4)].map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-9 w-full rounded-md" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const ListItemSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-4 border rounded-xl">
        <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-3/4 mb-1" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-16 rounded-md flex-shrink-0" />
      </div>
    ))}
  </div>
);

export const FacultyDashboardSkeleton = () => (
  <div className="space-y-4 sm:space-y-6 w-full max-w-full">
    {/* Title */}
    <div>
      <Skeleton className="h-7 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </div>

    {/* Badges */}
    <div className="flex gap-2">
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-5 w-28 rounded-full" />
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-1 px-3 pt-3">
            <Skeleton className="h-3 w-20" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <Skeleton className="h-6 w-12 mb-1" />
            <Skeleton className="h-2 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Chart */}
    <ChartSkeleton title="Attendance by Subject" />

    {/* Two column charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  </div>
);
