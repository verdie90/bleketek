"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Square,
  Coffee,
  Phone,
  PhoneOff,
  Timer,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useCallSession } from "@/hooks/use-call-session";

interface CallControlsProps {
  onCallStatusUpdate?: (status: string, notes?: string) => void;
}

export function CallControls({ onCallStatusUpdate }: CallControlsProps) {
  const {
    currentSession,
    currentCall,
    currentProspect,
    sessionTimer,
    callTimer,
    breakTimer,
    callQueue,
    callableProspects,
    loading,
    startSession,
    startBreak,
    endBreak,
    startNextCall,
    endCall,
    endSession,
    formatTime,
    maskPhoneNumber,
    getDispositionOptions,
    phoneSettings,
    workingScheduleStatus,
  } = useCallSession();

  const handleStartSession = async () => {
    // Langsung mulai session tanpa sync check
    const result = await startSession();
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleStartBreak = async () => {
    const result = await startBreak("Manual break");
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleEndBreak = async () => {
    const result = await endBreak();
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleEndCall = async (dispositionId: string, notes?: string) => {
    try {
      // Show info about auto dial status when processing disposition
      if (phoneSettings?.autoDialEnabled === false) {
      }

      if (phoneSettings?.autoNextCall === false) {
      }

      const result = await endCall(dispositionId, notes);

      if (!result.success) {
        console.error("❌ endCall failed:", result.error);
        alert(result.error || "Failed to process call disposition");
      } else {
        if (phoneSettings?.autoNextCall) {
        }
        onCallStatusUpdate?.(dispositionId, notes);
      }
    } catch (error) {
      console.error("❌ Error in CallControls.handleEndCall:", error);
      alert("Failed to process call disposition");
    }
  };

  const handleEndSession = async () => {
    if (confirm("Are you sure you want to end this session?")) {
      const result = await endSession();
      if (!result.success) {
        alert(result.error);
      }
    }
  };

  const handleStartPhone = async () => {
    try {
      console.log("🔔 Starting phone manually via Start Phone button");
      const result = await startNextCall();
      if (!result.success) {
        console.error("❌ startNextCall failed:", result.error);
        alert(result.error || "Failed to start call");
      } else {
        console.log("✅ Phone started successfully");
      }
    } catch (error) {
      console.error("❌ Error in handleStartPhone:", error);
      alert("Failed to start phone");
    }
  };

  const getSessionStatusColor = () => {
    switch (currentSession?.status) {
      case "active":
        return "bg-green-500";
      case "break":
        return "bg-yellow-500";
      case "ended":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getCallStatusColor = () => {
    switch (currentCall?.status) {
      case "calling":
        return "bg-blue-500";
      case "answered":
        return "bg-green-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      {/* Session Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Call Session
            {currentSession && (
              <Badge className={`${getSessionStatusColor()} text-white`}>
                {currentSession.status.toUpperCase()}
              </Badge>
            )}
            {phoneSettings !== null && (
              <>
                <Badge
                  variant={
                    phoneSettings.autoDialEnabled ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {phoneSettings.autoDialEnabled ? "🔊 Auto-dial" : "📵 Manual"}
                </Badge>
                <Badge
                  variant={phoneSettings.autoNextCall ? "default" : "secondary"}
                  className="text-xs"
                >
                  {phoneSettings.autoNextCall
                    ? "⏭️ Auto-next"
                    : "👆 Manual-next"}
                </Badge>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!currentSession ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                {callableProspects.length === 0
                  ? "No prospects available (status='new', source='import')"
                  : "Ready to start calling session"}
              </p>
              <Button
                onClick={handleStartSession}
                disabled={loading || callableProspects.length === 0}
                className="w-full"
              >
                <Play className="mr-2 h-4 w-4" />
                {loading ? "Starting..." : "Start Session"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Session Timer */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Session Time:
                </span>
                <span className="font-mono text-lg">
                  {formatTime(sessionTimer)}
                </span>
              </div>

              {/* Working Schedule Status */}
              {workingScheduleStatus && (
                <div
                  className={`p-2 rounded-md flex items-center gap-2 ${
                    workingScheduleStatus.isWorkingTime
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-orange-50 border border-orange-200 text-orange-700"
                  }`}
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      workingScheduleStatus.isWorkingTime
                        ? "bg-green-500"
                        : "bg-orange-500"
                    }`}
                  />
                  <span className="text-xs font-medium">
                    {workingScheduleStatus.isWorkingTime
                      ? "In working hours"
                      : "Outside working hours"}
                  </span>
                  {!workingScheduleStatus.isWorkingTime && (
                    <AlertCircle className="h-3 w-3" />
                  )}
                </div>
              )}

              {/* Session Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {currentSession.totalCalls}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {currentSession.completedCalls}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {callQueue.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Remaining</div>
                </div>
              </div>

              {/* Session Controls */}
              <div className="flex gap-2">
                {currentSession.status === "active" ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleStartBreak}
                      className="flex-1"
                    >
                      <Coffee className="mr-2 h-4 w-4" />
                      Break
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleEndSession}
                      className="flex-1"
                    >
                      <Square className="mr-2 h-4 w-4" />
                      End Session
                    </Button>
                  </>
                ) : currentSession.status === "break" ? (
                  <>
                    <div className="flex-1 text-center">
                      <div className="text-sm text-muted-foreground">
                        Break Time:
                      </div>
                      <div className="font-mono text-lg">
                        {formatTime(breakTimer)}
                      </div>
                    </div>
                    <Button onClick={handleEndBreak} className="flex-1">
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleEndSession}
                    className="w-full"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Close Session
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Call */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Current Call
              {currentCall && (
                <Badge className={`${getCallStatusColor()} text-white`}>
                  {currentCall.status.toUpperCase()}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Prospect Info - Always show if there's a prospect */}
              {currentCall ||
              callQueue.length > 0 ||
              callableProspects.length > 0 ? (
                <div className="space-y-2">
                  <div className="font-medium">
                    {currentProspect?.name ||
                      currentCall?.prospectName ||
                      callQueue[0]?.name ||
                      callableProspects[0]?.name ||
                      "Unknown"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Phone:{" "}
                    {currentCall?.maskedPhone ||
                      maskPhoneNumber(
                        currentProspect?.phone ||
                          callQueue[0]?.phone ||
                          callableProspects[0]?.phone ||
                          ""
                      )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Status:{" "}
                    {currentProspect?.status ||
                      currentCall?.disposition ||
                      callableProspects[0]?.status ||
                      "Ready to call"}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No prospects available for calling
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check your filter settings or add new prospects
                  </p>
                </div>
              )}

              {/* Call Timer - Only show if call is active */}
              {currentCall && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Call Duration:
                  </span>
                  <span className="font-mono text-lg">
                    {formatTime(callTimer)}
                  </span>
                </div>
              )}

              {/* Status Info */}
              {currentCall ? (
                <div className="text-center p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    📞{" "}
                    {phoneSettings?.autoDialEnabled
                      ? "Auto-dialing"
                      : "Manual dial"}
                    : {currentProspect?.phone || currentCall.prospectPhone}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {phoneSettings?.autoDialEnabled
                      ? "Call should have opened automatically"
                      : "Please dial manually (Auto-dial disabled in settings)"}
                  </p>
                </div>
              ) : callQueue.length > 0 || callableProspects.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700 font-medium">
                      📞 Ready to Start Call
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Click "Start Phone" to begin calling
                    </p>
                    {phoneSettings?.autoDialEnabled === false && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Auto-dial disabled - you'll need to dial manually
                      </p>
                    )}
                    {phoneSettings?.autoNextCall === false && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Auto-next call disabled - manual progression only
                      </p>
                    )}
                    {phoneSettings?.autoNextCall === true && (
                      <p className="text-xs text-green-600 mt-1">
                        ✅ Auto-next call enabled (
                        {phoneSettings?.callDelaySeconds || 1}s delay)
                      </p>
                    )}
                  </div>

                  {/* Start Phone Button - Show when session is active but no call in progress */}
                  {!currentCall && (
                    <Button
                      onClick={handleStartPhone}
                      disabled={
                        loading || !workingScheduleStatus?.isWorkingTime
                      }
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      {loading ? "Starting..." : "Start Phone"}
                    </Button>
                  )}
                </div>
              ) : null}

              {/* SOP 4: Call Disposition Buttons - Always show when session active and prospects available */}
              {(currentCall ||
                callQueue.length > 0 ||
                callableProspects.length > 0) &&
                getDispositionOptions().length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {getDispositionOptions().map((disposition) => (
                      <Button
                        key={disposition.id}
                        variant="outline"
                        onClick={() => handleEndCall(disposition.id)}
                        className={`border-2 hover:bg-opacity-10`}
                        style={{
                          borderColor: disposition.color,
                          color: disposition.color,
                        }}
                      >
                        {(disposition.name
                          .toLowerCase()
                          .includes("converted") ||
                          disposition.name
                            .toLowerCase()
                            .includes("qualified")) && (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        {(disposition.name.toLowerCase().includes("not") ||
                          disposition.name
                            .toLowerCase()
                            .includes("rejected")) && (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        {disposition.name
                          .toLowerCase()
                          .includes("contacted") && (
                          <Phone className="mr-2 h-4 w-4" />
                        )}
                        {disposition.name
                          .toLowerCase()
                          .includes("interested") && (
                          <Users className="mr-2 h-4 w-4" />
                        )}
                        {(disposition.name.toLowerCase().includes("new") ||
                          disposition.name.toLowerCase().includes("lead")) && (
                          <Timer className="mr-2 h-4 w-4" />
                        )}
                        {disposition.name}
                      </Button>
                    ))}
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
