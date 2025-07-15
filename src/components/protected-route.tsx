"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check role if required
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-gray-600">
            Anda tidak memiliki permission untuk mengakses halaman ini.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Role diperlukan: {requiredRole}
          </p>
        </div>
      </div>
    );
  }

  // TODO: Add permission checking when roles system is integrated
  // if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
  //   return <div>No permission</div>;
  // }

  return <>{children}</>;
}

// Higher-order component for protecting pages
export function withAuth<T extends {}>(
  Component: React.ComponentType<T>,
  options?: {
    requiredRole?: string;
    requiredPermission?: string;
  }
) {
  return function AuthenticatedComponent(props: T) {
    return (
      <ProtectedRoute
        requiredRole={options?.requiredRole}
        requiredPermission={options?.requiredPermission}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
