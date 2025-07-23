import { Skeleton } from "@/components/ui/skeleton";

// Skeleton khusus untuk komponen yang sering loading
export function SidebarSkeleton() {
  return (
    <div className="w-64 border-r bg-background p-4">
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-6 w-full" />
              {i % 3 === 0 && (
                <div className="ml-4 space-y-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-2/3" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BreadcrumbSkeleton() {
  return (
    <div className="flex items-center space-x-1">
      <Skeleton className="h-4 w-16" />
      <span className="text-muted-foreground">/</span>
      <Skeleton className="h-4 w-20" />
      <span className="text-muted-foreground">/</span>
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="flex h-16 items-center gap-2 border-b px-4">
      <Skeleton className="h-6 w-6" />
      <Skeleton className="h-4 w-px" />
      <BreadcrumbSkeleton />
    </div>
  );
}
