"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/login-form-new";
import { useAuth } from "@/hooks/use-auth";
import { LoginSkeleton } from "@/components/ui/page-skeletons";
import { usePageLoading } from "@/hooks/use-page-loading";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const isPageLoading = usePageLoading(800);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleLoginSuccess = () => {
    router.push("/dashboard");
  };

  if (isLoading || isPageLoading) {
    return <LoginSkeleton />;
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}
