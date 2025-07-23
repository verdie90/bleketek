"use client";

import { ReactNode } from "react";
import { usePageLoading } from "@/hooks/use-page-loading";
import { 
  DashboardSkeleton, 
  TablePageSkeleton, 
  FormPageSkeleton, 
  LoginSkeleton, 
  CardGridSkeleton 
} from "@/components/ui/page-skeletons";

type PageType = "dashboard" | "table" | "form" | "login" | "card-grid";

interface PageWrapperProps {
  children: ReactNode;
  pageType: PageType;
  loadingDelay?: number;
  isLoading?: boolean;
}

export function PageWrapper({ 
  children, 
  pageType, 
  loadingDelay = 800,
  isLoading: externalLoading 
}: PageWrapperProps) {
  const internalLoading = usePageLoading(loadingDelay);
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  if (isLoading) {
    switch (pageType) {
      case "dashboard":
        return <DashboardSkeleton />;
      case "table":
        return <TablePageSkeleton />;
      case "form":
        return <FormPageSkeleton />;
      case "login":
        return <LoginSkeleton />;
      case "card-grid":
        return <CardGridSkeleton />;
      default:
        return <DashboardSkeleton />;
    }
  }

  return <>{children}</>;
}

// HOC untuk wrapping halaman dengan skeleton
export function withPageSkeleton<T extends object>(
  Component: React.ComponentType<T>,
  pageType: PageType,
  loadingDelay?: number
) {
  return function WrappedComponent(props: T) {
    return (
      <PageWrapper pageType={pageType} loadingDelay={loadingDelay}>
        <Component {...props} />
      </PageWrapper>
    );
  };
}
