"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ExternalLink,
  Shield,
  CheckCircle,
  Settings,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function FirebaseAuthChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const [authStatus, setAuthStatus] = useState<
    "unknown" | "enabled" | "disabled"
  >("unknown");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(true);

  // Test Firebase Auth configuration
  const testFirebaseAuth = async () => {
    setIsChecking(true);
    setTestResult(null);

    try {
      // Try to create a test user to check if auth is enabled
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = "TestPassword123!";

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        testEmail,
        testPassword
      );

      // If we get here, auth is working - clean up the test user
      if (userCredential.user) {
        await userCredential.user.delete();
        setAuthStatus("enabled");
        setTestResult("✅ Firebase Authentication is properly configured");
        toast.success("Firebase Authentication is working correctly");
      }
    } catch (error: any) {

      if (error.code === "auth/operation-not-allowed") {
        setAuthStatus("disabled");
        setTestResult(
          "❌ Email/Password authentication is not enabled in Firebase Console"
        );
        toast.error("Email/Password authentication needs to be enabled");
      } else if (error.code === "auth/weak-password") {
        // This actually means auth is enabled but password is weak
        setAuthStatus("enabled");
        setTestResult(
          "✅ Firebase Authentication is enabled (weak password error is expected)"
        );
        toast.success("Firebase Authentication is working correctly");
      } else {
        setAuthStatus("disabled");
        setTestResult(`❌ Firebase Auth Error: ${error.message}`);
        toast.error(`Auth test failed: ${error.message}`);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const steps = [
    {
      title: "Open Firebase Console",
      description: "Go to the Firebase Console and select your project",
      action: "https://console.firebase.google.com/",
    },
    {
      title: "Navigate to Authentication",
      description: "In the left sidebar, click on 'Authentication'",
      detail: "Look for the shield icon in the Firebase Console sidebar",
    },
    {
      title: "Go to Sign-in Method",
      description: "Click on the 'Sign-in method' tab",
      detail: "This is where you configure authentication providers",
    },
    {
      title: "Enable Email/Password",
      description:
        "Find 'Email/Password' in the providers list and click on it",
      detail: "It should be in the 'Native providers' section",
    },
    {
      title: "Enable the Provider",
      description: "Toggle the 'Enable' switch and click 'Save'",
      detail:
        "Make sure to enable the first option (Email/Password), not just Email link",
    },
    {
      title: "Verify Configuration",
      description: "Return to your app and test user creation",
      detail: "The authentication should now work properly",
    },
  ];

  useEffect(() => {
    // Auto-test on component mount
    testFirebaseAuth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Firebase Authentication Status</span>
          </CardTitle>
          <CardDescription>
            Check if Firebase Email/Password authentication is properly
            configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {authStatus === "enabled" && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              {authStatus === "disabled" && (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              {authStatus === "unknown" && (
                <Settings className="h-5 w-5 text-gray-600" />
              )}

              <div>
                <div className="font-medium">
                  {authStatus === "enabled" && "Authentication Enabled"}
                  {authStatus === "disabled" && "Authentication Disabled"}
                  {authStatus === "unknown" && "Checking Configuration..."}
                </div>
                {testResult && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {testResult}
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={testFirebaseAuth}
              disabled={isChecking}
              variant="outline"
              size="sm"
            >
              {isChecking ? "Testing..." : "Test Again"}
            </Button>
          </div>

          {authStatus === "enabled" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Firebase Authentication is working correctly. You can now create
                users successfully.
              </AlertDescription>
            </Alert>
          )}

          {authStatus === "disabled" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Email/Password authentication is not enabled in Firebase
                Console. Follow the steps below to enable it.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuration Steps */}
      {authStatus === "disabled" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>How to Enable Firebase Authentication</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSteps(!showSteps)}
              >
                {showSteps ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showSteps ? "Hide" : "Show"} Steps
              </Button>
            </CardTitle>
            <CardDescription>
              Follow these steps to enable Email/Password authentication in
              Firebase Console
            </CardDescription>
          </CardHeader>

          {showSteps && (
            <CardContent className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{step.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {step.description}
                      </div>
                      {step.detail && (
                        <div className="text-xs text-muted-foreground mt-1">
                          💡 {step.detail}
                        </div>
                      )}
                      {step.action && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => window.open(step.action, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open Firebase Console
                        </Button>
                      )}
                    </div>
                  </div>
                  {index < steps.length - 1 && <Separator className="ml-9" />}
                </div>
              ))}

              <Separator />

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Quick Reference
                </h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div>
                    🔗 Firebase Console: https://console.firebase.google.com/
                  </div>
                  <div>
                    📍 Location: Authentication → Sign-in method →
                    Email/Password
                  </div>
                  <div>⚡ Action: Enable the "Email/Password" provider</div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Firebase Configuration</CardTitle>
          <CardDescription>
            Your current Firebase project settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-muted-foreground">
                Project ID
              </div>
              <div className="flex items-center space-x-2">
                <code className="bg-gray-100 px-2 py-1 rounded">
                  {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
                    "Not configured"}
                </code>
                {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!
                      )
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <div className="font-medium text-muted-foreground">
                Auth Domain
              </div>
              <div className="flex items-center space-x-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
                    "Not configured"}
                </code>
                {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!
                      )
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {(!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
            !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Firebase environment variables are missing. Make sure your .env
                file contains the correct Firebase configuration.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Error Help */}
      <Card>
        <CardHeader>
          <CardTitle>Common Error Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3 text-sm">
            <div className="border-l-4 border-red-500 pl-4">
              <div className="font-medium text-red-700">
                auth/operation-not-allowed
              </div>
              <div className="text-red-600">
                Email/Password authentication is not enabled in Firebase Console
              </div>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <div className="font-medium text-orange-700">
                auth/weak-password
              </div>
              <div className="text-orange-600">
                Password should be at least 6 characters (this means auth is
                working)
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <div className="font-medium text-blue-700">
                auth/email-already-in-use
              </div>
              <div className="text-blue-600">
                The email address is already registered (auth is working)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
