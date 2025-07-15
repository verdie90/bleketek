"use client";

import { Suspense } from "react";
import FirebaseAuthChecker from "@/components/firebase-auth-checker";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

function FirebaseSetupLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Card Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span>Loading Firebase configuration...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FirebaseSetupPage() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Firebase Setup</h1>
          <p className="text-muted-foreground mt-2">
            Configure and verify Firebase Authentication for your application
          </p>
        </div>

        {/* Main Content */}
        <Suspense fallback={<FirebaseSetupLoading />}>
          <FirebaseAuthChecker />
        </Suspense>
      </div>
    </div>
  );
}
