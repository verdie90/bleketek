"use client";

import { DatabaseInitializer } from "@/components/database-initializer";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageLoading } from "@/hooks/use-page-loading";

export default function InitializePage() {
  const isLoading = usePageLoading(600);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-10 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return <DatabaseInitializer />;
}
