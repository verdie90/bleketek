"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Phone, Users, Clock, Target, Filter } from "lucide-react";
import { CallControls } from "@/components/call-controls";
import { ScriptViewer } from "@/components/script-viewer";
import { useCallSession } from "@/hooks/use-call-session";
import { useProspects } from "@/hooks/use-prospects";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";

export default function TelemarketingCallsPage() {
  const { user } = useAuth();
  const {
    currentSession,
    currentCall,
    currentProspect,
    callableProspects,
    sessionTimer,
    breakTimer,
    formatTime,
    prospectFilters,
    loading,
    getSessionStats,
    startSession,
    endCall,
    getDispositionOptions,
  } = useCallSession();

  const { prospects } = useProspects();

  const [callNotes, setCallNotes] = useState("");


  const handleCallStatusUpdate = useCallback((status: string, notes?: string) => {
    console.log("Call completed:", { status, notes });
    setCallNotes("");
  }, []);

  // Calculate real-time session statistics
  const sessionStats = getSessionStats();
  const stats = useMemo(() => {
    // Calculate session duration display
    let sessionDuration = "00:00";
    
    if (sessionStats.isActive) {
      if (sessionStats.status === "break") {
        sessionDuration = `Break: ${formatTime(breakTimer)}`;
      } else {
        sessionDuration = formatTime(sessionStats.duration);
      }
    } else if (sessionStats.status === "ended" && currentSession?.duration) {
      sessionDuration = formatTime(currentSession.duration);
    }

    return {
      availableProspects: callableProspects.length,
      activeSession: sessionStats.isActive ? 1 : 0,
      sessionDuration,
      completedCalls: sessionStats.completedCalls,
      totalCalls: sessionStats.totalCalls,
      sessionStatus: sessionStats.status,
      isLoading: loading,
    };
  }, [
    callableProspects.length, 
    sessionStats, 
    breakTimer, 
    formatTime, 
    currentSession?.duration,
    loading
  ]);

  return (

    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/telemarketing">
                    Telemarketing
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Phone Calls</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">

          {/* Current Filter Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Active Prospect Filter
              </CardTitle>
              <CardDescription>
                Filters are configured in Telemarketing Settings. Only prospects matching these criteria will be available for calling.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Current Filter:</strong> Status = "
                      {prospectFilters.statusName}", Source = "
                      {prospectFilters.sourceName}"
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Showing {callableProspects.length} prospects matching these criteria
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      📝 To change filters, go to Settings → Telemarketing → Phone Settings
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Prospects
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {callableProspects.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Prospects with phone numbers (active)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Session
                </CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSession}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.sessionStatus === "active" ? "Session Active" : 
                   stats.sessionStatus === "break" ? "On Break" :
                   stats.sessionStatus === "ended" ? "Session Ended" : "No active session"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Session Duration
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {stats.sessionDuration}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current session time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Calls
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedCalls}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalCalls > 0
                    ? `${Math.round((stats.completedCalls / stats.totalCalls) * 100)}% of ${stats.totalCalls} total`
                    : "No active session"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Debug Test Panel - Only show if there's a current prospect or session */}
            {(currentProspect || currentSession) && (
              <div className="md:col-span-full mb-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">🧪 Debug Call Disposition Test</CardTitle>
                    <CardDescription>
                      Test lastContactDate update via call disposition
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>Current Prospect:</strong> {currentProspect?.name || "None"}
                      </p>
                      <p className="text-sm">
                        <strong>Session Active:</strong> {currentSession?.status || "None"}
                      </p>
                      <div className="flex gap-2">
                        {getDispositionOptions().slice(0, 3).map((disposition) => (
                          <Button
                            key={disposition.id}
                            size="sm"
                            onClick={async () => {
                              console.log("🧪 Testing call disposition directly:", disposition.name);
                              const result = await endCall(disposition.id, "Test from debug panel");
                              console.log("🧪 Direct endCall result:", result);
                              if (result.success) {
                                alert(`✅ Test disposition "${disposition.name}" successful - check prospects table`);
                              } else {
                                alert(`❌ Test failed: ${result.error}`);
                              }
                            }}
                            disabled={!currentProspect && !callableProspects.length}
                          >
                            Test {disposition.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Call Controls - Full height on mobile, left column on desktop */}
            <div className="md:col-span-1">
              {(!currentSession || stats.sessionStatus === "ended") ? (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    {callableProspects.length === 0
                      ? "No prospects available (status='new', source='import')"
                      : "Ready to start calling session"}
                  </p>
                  <Button
                    onClick={async () => {
                      if (loading || callableProspects.length === 0) return;
                      const result = await startSession();
                      if (result && !result.success && result.error) {
                        alert(result.error);
                      }
                    }}
                    disabled={loading || callableProspects.length === 0}
                    className="w-full"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {loading ? "Starting..." : "Start Session"}
                  </Button>
                </div>
              ) : (
                <CallControls onCallStatusUpdate={handleCallStatusUpdate} />
              )}
            </div>

            {/* Script Viewer - Takes remaining space */}
            <div className="md:col-span-1 lg:col-span-2">
              <ScriptViewer currentProspect={currentProspect} />
            </div>
          </div>

          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle>How to Use Phone Calls</CardTitle>
              <CardDescription>
                Follow these steps to conduct effective telemarketing calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      🎯 Prospect Filtering
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • Prospect filters are configured in Telemarketing Settings
                      </li>
                      <li>
                        • Go to Settings → Telemarketing → Phone Settings to change filters
                      </li>
                      <li>
                        • Set default status and source filters for auto calling
                      </li>
                      <li>
                        • Only prospects matching both filters will be available
                        for calling
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      📞 Starting Calls
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • Click "Start Session" to begin calling filtered prospects
                      </li>
                      <li>
                        • System queues prospects matching your configured filters
                      </li>
                      <li>
                        • Phone numbers show last 3 digits hidden for preview
                      </li>
                      <li>
                        • Auto-calling respects delay settings between calls
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      ⏱️ Managing Sessions
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Use "Break" button to pause your session</li>
                      <li>• Session timer tracks your active calling time</li>
                      <li>• Break timer tracks pause duration separately</li>
                      <li>• End session when done for the day</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      🔄 Auto Call Features
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • Enable "Auto Next Call" in Telemarketing Settings
                      </li>
                      <li>
                        • Set call delay (seconds) between auto calls
                      </li>
                      <li>
                        • System automatically moves to next prospect after disposition
                      </li>
                      <li>
                        • Prevents race conditions and ensures smooth calling flow
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      📋 Using Scripts
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Select appropriate script from dropdown</li>
                      <li>• Script will auto-fill prospect information</li>
                      <li>• Copy script content to clipboard if needed</li>
                      <li>• Usage is automatically tracked</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      ✅ Call Disposition
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Choose call outcome from dynamic status buttons</li>
                      <li>• Dispositions are loaded from database settings</li>
                      <li>
                        • Prospect status is automatically mapped and updated
                      </li>
                      <li>• Prospect is automatically assigned to the calling agent</li>
                      <li>• Call duration and notes are recorded</li>
                      <li>• System moves to next prospect automatically</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
