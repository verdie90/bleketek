"use client";

import { useEffect, useState } from "react";
import { useRoles } from "@/hooks/use-roles";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function RoleInitializer() {
  const {
    roles,
    loading,
    error,
    initializeDefaultRoles,
    getActiveRoles,
    getAvailablePermissions,
  } = useRoles();

  const [initializing, setInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if roles are already initialized
    if (roles.length > 0) {
      setIsInitialized(true);
    }
  }, [roles]);

  const handleInitialize = async () => {
    setInitializing(true);
    try {
      const result = await initializeDefaultRoles();
      if (result.success) {
        toast.success("Default roles initialized successfully");
        setIsInitialized(true);
      } else {
        toast.error(result.error || "Failed to initialize roles");
      }
    } catch (error) {
      toast.error("An error occurred while initializing roles");
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span>Loading roles...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">Error Loading Roles</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isInitialized && roles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Role System Setup</span>
          </CardTitle>
          <CardDescription>
            Initialize the role system with default roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>The role system needs to be initialized with default roles:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>Administrator</strong> - Full system access
              </li>
              <li>
                <strong>Manager</strong> - Management level access
              </li>
              <li>
                <strong>Agent</strong> - Agent level access for operations
              </li>
              <li>
                <strong>Viewer</strong> - Read-only access
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleInitialize}
              disabled={initializing}
              className="w-full"
            >
              {initializing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Initialize Default Roles
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>Role System Status</span>
        </CardTitle>
        <CardDescription>Role system is properly configured</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Available Roles</h4>
          <div className="flex flex-wrap gap-2">
            {getActiveRoles().map((role) => (
              <Badge key={role.id} variant="outline">
                {role.name} ({role.permissions.length} permissions)
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">System Statistics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Roles:</span>
              <span className="ml-2 font-medium">{roles.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Active Roles:</span>
              <span className="ml-2 font-medium">
                {getActiveRoles().length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Permissions:</span>
              <span className="ml-2 font-medium">
                {getAvailablePermissions().length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
