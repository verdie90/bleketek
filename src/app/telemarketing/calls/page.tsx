"use client";

import { useState } from "react";
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
import { useTelemarketingSettings } from "@/hooks/use-telemarketing-settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function TelemarketingCallsPage() {
  const {
    currentSession,
    currentProspect,
    callableProspects,
    sessionTimer,
    formatTime,
    setProspectFilters,
    prospectFilters,
  } = useCallSession();

  const { getActiveProspectStatuses, getActiveProspectSources } =
    useTelemarketingSettings();

  const [callNotes, setCallNotes] = useState("");

  // Get available statuses and sources
  const availableStatuses = getActiveProspectStatuses();
  const availableSources = getActiveProspectSources();

  const handleCallStatusUpdate = (status: string, notes?: string) => {
    console.log("Call completed:", { status, notes });
    setCallNotes("");
  };

  const handleStatusFilterChange = (statusId: string) => {
    const selectedStatus = availableStatuses.find((s) => s.id === statusId);
    setProspectFilters({
      ...prospectFilters,
      statusName: selectedStatus?.name || "",
    });
  };

  const handleSourceFilterChange = (sourceId: string) => {
    const selectedSource = availableSources.find((s) => s.id === sourceId);
    setProspectFilters({
      ...prospectFilters,
      sourceName: selectedSource?.name || "",
    });
  };

  // Calculate statistics
  const stats = {
    availableProspects: callableProspects.length,
    activeSession: currentSession ? 1 : 0,
    sessionDuration: currentSession ? formatTime(sessionTimer) : "00:00",
    completedCalls: currentSession?.completedCalls || 0,
  };

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
          {/* Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Prospect Filters
              </CardTitle>
              <CardDescription>
                Select status and source to filter available prospects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Prospect Status</Label>
                  <Select
                    value={
                      availableStatuses.find(
                        (s) => s.name === prospectFilters.statusName
                      )?.id || ""
                    }
                    onValueChange={handleStatusFilterChange}
                  >
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.id!}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            {status.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source-filter">Prospect Source</Label>
                  <Select
                    value={
                      availableSources.find(
                        (s) => s.name === prospectFilters.sourceName
                      )?.id || ""
                    }
                    onValueChange={handleSourceFilterChange}
                  >
                    <SelectTrigger id="source-filter">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSources.map((source) => (
                        <SelectItem key={source.id} value={source.id!}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: source.color }}
                            />
                            {source.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Current Filter:</strong> Status = "
                  {prospectFilters.statusName}", Source = "
                  {prospectFilters.sourceName}"
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Showing {stats.availableProspects} prospects matching these
                  criteria
                </p>
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
                  {stats.availableProspects}
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
                  {currentSession?.status || "No active session"}
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
                  {currentSession
                    ? `${Math.round(
                        (stats.completedCalls / currentSession.totalCalls) * 100
                      )}% of total`
                    : "No active session"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Call Controls - Full height on mobile, left column on desktop */}
            <div className="md:col-span-1">
              <CallControls onCallStatusUpdate={handleCallStatusUpdate} />
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
                      � Filtering Prospects
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • Use status filter to select prospect status (e.g.,
                        "Baru", "Contacted")
                      </li>
                      <li>
                        • Use source filter to select prospect source (e.g.,
                        "Database", "Website")
                      </li>
                      <li>
                        • Only prospects matching both filters will be available
                        for calling
                      </li>
                      <li>
                        • Change filters anytime to target different prospect
                        segments
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      📞 Starting Calls
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • Click "Start Session" to begin auto-calling filtered
                        prospects
                      </li>
                      <li>
                        • System will queue prospects matching your selected
                        filters
                      </li>
                      <li>
                        • Phone numbers will show last 3 digits hidden for
                        preview
                      </li>
                      <li>
                        • Calls will start automatically after session starts
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
