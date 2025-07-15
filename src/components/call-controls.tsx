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
    dispositionStatuses,
    loading,
    isDataSynced,
    startSession,
    startBreak,
    endBreak,
    endCall,
    endSession,
    syncAllData,
    formatTime,
    maskPhoneNumber,
    getDispositionOptions,
  } = useCallSession();

  const handleStartSession = async () => {
    // SOP: Sinkronisasi data terlebih dahulu sebelum memulai sesi
    if (!isDataSynced) {
      await syncAllData();
    }

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
    const result = await endCall(dispositionId, notes);
    if (!result.success) {
      alert(result.error);
    } else {
      onCallStatusUpdate?.(dispositionId, notes);
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!currentSession ? (
            <div className="text-center space-y-4">
              {/* Data Sync Status */}
              <div className="text-xs">
                <Badge variant={isDataSynced ? "default" : "destructive"}>
                  {isDataSynced ? "📊 Data Synced" : "⏳ Syncing..."}
                </Badge>
                <p className="mt-1 text-muted-foreground">
                  Prospects: {callableProspects.length} | Status Options:{" "}
                  {dispositionStatuses.length}
                </p>
              </div>

              <p className="text-muted-foreground">
                {callableProspects.length === 0
                  ? "No prospects available (status='new', source='import')"
                  : "Ready to start calling session"}
              </p>
              <Button
                onClick={handleStartSession}
                disabled={
                  loading || !isDataSynced || callableProspects.length === 0
                }
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
            {!currentCall ? (
              <div className="text-center space-y-4">
                {callQueue.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-muted-foreground">Next prospect:</p>
                      <div className="font-medium">{callQueue[0]?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {maskPhoneNumber(callQueue[0]?.phone || "")}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700 font-medium">
                        📞 Auto-Call Mode Active
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Calls will start automatically after each disposition
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    No more prospects to call
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current Prospect Info */}
                <div className="space-y-2">
                  <div className="font-medium">{currentProspect?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Phone: {currentCall.maskedPhone}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Status: {currentProspect?.status || "N/A"}
                  </div>
                </div>

                {/* Call Timer */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Call Duration:
                  </span>
                  <span className="font-mono text-lg">
                    {formatTime(callTimer)}
                  </span>
                </div>

                {/* Auto-dial Info */}
                <div className="text-center p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    📞 Auto-dialing: {currentProspect?.phone}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Call should have opened automatically
                  </p>
                </div>

                {/* SOP 4: Call Disposition Buttons - Update status sesuai database */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Menggunakan status dari database yang sudah disinkronisasi */}
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
                      {(disposition.name.toLowerCase().includes("converted") ||
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
                      {disposition.name.toLowerCase().includes("contacted") && (
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
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
