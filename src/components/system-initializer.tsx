"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  RefreshCw,
  Database,
  Users,
  Shield,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useUserManagement } from "@/hooks/use-user-management";
import { useRoles } from "@/hooks/use-roles";

export default function SystemInitializer() {
  const { createUser, users } = useUserManagement();
  const { roles, initializeDefaultRoles, getActiveRoles } = useRoles();

  const [initializing, setInitializing] = useState(false);
  const [step, setStep] = useState(0);

  const sampleUsers = [
    {
      email: "admin@bleketek.com",
      firstName: "System",
      lastName: "Administrator",
      displayName: "System Administrator",
      role: "Administrator",
      position: "System Administrator",
      password: "Admin123!@#",
      isActive: true,
      notes: "Default system administrator account",
    },
    {
      email: "manager@bleketek.com",
      firstName: "John",
      lastName: "Manager",
      displayName: "John Manager",
      role: "Manager",
      position: "Operations Manager",
      password: "Manager123!@#",
      isActive: true,
      notes: "Sample manager account",
    },
    {
      email: "agent@bleketek.com",
      firstName: "Jane",
      lastName: "Agent",
      displayName: "Jane Agent",
      role: "Agent",
      position: "Telemarketing Agent",
      password: "Agent123!@#",
      isActive: true,
      notes: "Sample agent account",
    },
    {
      email: "viewer@bleketek.com",
      firstName: "Bob",
      lastName: "Viewer",
      displayName: "Bob Viewer",
      role: "Viewer",
      position: "Data Analyst",
      password: "Viewer123!@#",
      isActive: true,
      notes: "Sample viewer account",
    },
  ];

  const initializeSystem = async () => {
    setInitializing(true);
    setStep(0);

    try {
      // Step 1: Initialize roles
      setStep(1);
      toast.info("Initializing roles...");
      const rolesResult = await initializeDefaultRoles();

      if (!rolesResult.success) {
        throw new Error(rolesResult.error || "Failed to initialize roles");
      }

      toast.success("Roles initialized successfully");

      // Wait a bit for roles to be available
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 2: Create sample users
      setStep(2);
      toast.info("Creating sample users...");

      for (let i = 0; i < sampleUsers.length; i++) {
        const user = sampleUsers[i];
        toast.info(`Creating user: ${user.email}`);

        const userResult = await createUser(
          {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            role: user.role,
            position: user.position,
            isActive: user.isActive,
            isEmailVerified: false,
            createdBy: "system-initializer",
            notes: user.notes,
          },
          user.password
        );

        if (!userResult.success) {
          console.warn(
            `Failed to create user ${user.email}:`,
            userResult.error
          );
          toast.warning(
            `Warning: Could not create ${user.email} - ${userResult.error}`
          );
        } else {
          toast.success(`Created user: ${user.email}`);
        }

        // Small delay between user creations
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setStep(3);
      toast.success("System initialization completed successfully!");
    } catch (error) {
      console.error("System initialization error:", error);
      toast.error(
        `Initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setInitializing(false);
    }
  };

  const isSystemInitialized = () => {
    return getActiveRoles().length > 0 && users.length > 0;
  };

  const getStepStatus = (stepNumber: number) => {
    if (step > stepNumber) return "completed";
    if (step === stepNumber && initializing) return "active";
    return "pending";
  };

  const getStepIcon = (stepNumber: number) => {
    const status = getStepStatus(stepNumber);
    if (status === "completed")
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === "active")
      return <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />;
    return <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />;
  };

  if (isSystemInitialized()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>System Ready</span>
          </CardTitle>
          <CardDescription>
            Your system is fully initialized and ready to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Shield className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {getActiveRoles().length}
              </div>
              <div className="text-sm text-green-600">Roles Configured</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {users.length}
              </div>
              <div className="text-sm text-blue-600">Users Created</div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Sample User Accounts</h4>
            <div className="space-y-2 text-sm">
              {sampleUsers.map((user) => (
                <div
                  key={user.email}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-medium">{user.email}</span>
                    <Badge variant="outline" className="ml-2">
                      {user.role}
                    </Badge>
                  </div>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {user.password}
                  </code>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              * Please change default passwords after first login
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>System Initialization</span>
        </CardTitle>
        <CardDescription>
          Initialize your system with default roles and sample users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            {getStepIcon(1)}
            <div className="flex-1">
              <div className="font-medium">Initialize Roles</div>
              <div className="text-sm text-muted-foreground">
                Create default roles (Administrator, Manager, Agent, Viewer)
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {getStepIcon(2)}
            <div className="flex-1">
              <div className="font-medium">Create Sample Users</div>
              <div className="text-sm text-muted-foreground">
                Create sample user accounts for each role
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {getStepIcon(3)}
            <div className="flex-1">
              <div className="font-medium">Complete Setup</div>
              <div className="text-sm text-muted-foreground">
                Finalize system configuration
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Sample Users Preview */}
        <div>
          <h4 className="font-medium mb-3">Users to be created:</h4>
          <div className="space-y-2">
            {sampleUsers.map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{user.displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.email}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{user.role}</Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {user.position}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Security Notice */}
        <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-amber-800">Security Notice</div>
            <div className="text-amber-700 mt-1">
              Sample users will be created with default passwords. Please change
              these passwords immediately after initialization for security
              purposes.
            </div>
          </div>
        </div>

        {/* Initialize Button */}
        <Button
          onClick={initializeSystem}
          disabled={initializing}
          className="w-full"
          size="lg"
        >
          {initializing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Initializing System... (Step {step}/3)
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Initialize System
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
