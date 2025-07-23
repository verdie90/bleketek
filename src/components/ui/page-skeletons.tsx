import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Skeleton untuk dashboard dengan sidebar
export function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r bg-background p-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-4 w-px" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-4 space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Skeleton untuk halaman dengan tabel
export function TablePageSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r bg-background p-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-4 w-px" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {/* Filters and buttons */}
          <div className="flex gap-2 items-center justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>

          {/* Table skeleton */}
          <Card>
            <CardContent className="p-0">
              <div className="border rounded-lg">
                {/* Table header */}
                <div className="flex items-center h-12 px-4 border-b bg-muted/50">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-20 mx-2" />
                  ))}
                </div>
                {/* Table rows */}
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center h-12 px-4 border-b">
                    {[...Array(5)].map((_, j) => (
                      <Skeleton key={j} className="h-4 w-16 mx-2" />
                    ))}
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

// Skeleton untuk form/settings pages
export function FormPageSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r bg-background p-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-4 w-px" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-4 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Skeleton untuk login page
export function LoginSkeleton() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Skeleton untuk card grid layout
export function CardGridSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r bg-background p-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-4 w-px" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-24 mt-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
