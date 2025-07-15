"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useProspects, Prospect } from "@/hooks/use-prospects";
import {
  useTelemarketingSettings,
  ProspectStatus,
} from "@/hooks/use-telemarketing-settings";

export type SessionStatus = "idle" | "active" | "break" | "ended";
export type CallStatus =
  | "pending"
  | "calling"
  | "answered"
  | "no_answer"
  | "busy"
  | "voicemail"
  | "completed";

export interface CallSession {
  id?: string;
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  status: SessionStatus;
  totalCalls: number;
  completedCalls: number;
  successfulCalls: number;
  duration: number; // in seconds
  breaks: Break[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Break {
  startTime: Timestamp;
  endTime?: Timestamp;
  duration?: number; // in seconds
  reason?: string;
}

export interface CallLog {
  id?: string;
  sessionId: string;
  prospectId: string;
  prospectName: string;
  prospectPhone: string;
  maskedPhone: string; // Phone with last 3 digits hidden
  startTime: Timestamp;
  endTime?: Timestamp;
  duration: number; // in seconds
  status: CallStatus;
  disposition?: string; // Status prospect after call
  notes?: string;
  scriptUsed?: string;
  userId: string;
  createdAt: Timestamp;
}

// Filter interface for prospect filtering
export interface ProspectFilters {
  statusName: string;
  sourceName: string;
}

export function useCallSession() {
  const { user } = useAuth();
  const { prospects, updateProspect } = useProspects();
  const { getActiveProspectStatuses, getActiveProspectSources } =
    useTelemarketingSettings();

  // Core session state
  const [currentSession, setCurrentSession] = useState<CallSession | null>(
    null
  );
  const [currentCall, setCurrentCall] = useState<CallLog | null>(null);
  const [currentProspect, setCurrentProspect] = useState<Prospect | null>(null);

  // Database-synced data
  const [callableProspects, setCallableProspects] = useState<Prospect[]>([]);
  const [dispositionStatuses, setDispositionStatuses] = useState<
    ProspectStatus[]
  >([]);
  const [callQueue, setCallQueue] = useState<Prospect[]>([]);

  // Timers
  const [sessionTimer, setSessionTimer] = useState(0);
  const [callTimer, setCallTimer] = useState(0);
  const [breakTimer, setBreakTimer] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDataSynced, setIsDataSynced] = useState(false);

  // Prospect filters
  const [prospectFilters, setProspectFilters] = useState<ProspectFilters>({
    statusName: "Baru", // Default status
    sourceName: "Database", // Default source
  });

  // Ref untuk menghindari infinite loop
  const lastProspectsLength = useRef(0);
  const isInitialized = useRef(false);

  // SOP 5: Helper functions menggunakan sumber database

  // SOP: Sinkronisasi semua data dari database
  const syncAllData = useCallback(async () => {
    setIsDataSynced(false);

    try {
      // Get all active statuses and sources from database
      const statuses = getActiveProspectStatuses();
      const sources = getActiveProspectSources();
      setDispositionStatuses(statuses);

      // Find selected source from telemarketing_prospect_sources collection
      const selectedSource = sources.find(
        (source) => source.name === prospectFilters.sourceName
      );

      if (!selectedSource) {
        console.warn(
          `No '${prospectFilters.sourceName}' source found in telemarketing_prospect_sources`
        );
        setCallableProspects([]);
        setIsDataSynced(true);
        return { prospects: [], statuses };
      }

      // Filter prospects: berdasarkan filter yang dipilih user
      const filtered = prospects.filter(
        (prospect) =>
          prospect.phone &&
          prospect.status === prospectFilters.statusName &&
          prospect.source === selectedSource.name
      );

      setCallableProspects(filtered);

      // Enhanced logging for debugging
      console.log("📋 Fetched callable prospects:", {
        total: prospects.length,
        callable: filtered.length,
        criteria: `status=${prospectFilters.statusName}, source=${prospectFilters.sourceName} (from collection)`,
        targetStatus: prospectFilters.statusName,
        selectedSourceId: selectedSource.id,
        breakdown: {
          withPhone: prospects.filter((p) => p.phone).length,
          statusMatch: prospects.filter(
            (p) => p.status === prospectFilters.statusName
          ).length,
          sourceMatch: prospects.filter(
            (p) => p.source === prospectFilters.sourceName
          ).length,
          bothConditions: prospects.filter(
            (p) =>
              p.status === prospectFilters.statusName &&
              p.source === prospectFilters.sourceName
          ).length,
        },
      });

      // Fetch statuses
      setDispositionStatuses(statuses);

      console.log("📊 Fetched disposition statuses:", {
        count: statuses.length,
        statuses: statuses.map((s) => s.name),
      });

      setIsDataSynced(true);
      console.log("✅ Data synchronization complete");

      return { prospects: filtered, statuses };
    } catch (err) {
      console.error("Error syncing data:", err);
      setError("Failed to sync data");
      setIsDataSynced(false);
      return { prospects: [], statuses: [] };
    }
  }, [
    prospects,
    getActiveProspectStatuses,
    getActiveProspectSources,
    prospectFilters,
  ]);

  // Mask phone number (hide last 3 digits)
  const maskPhoneNumber = useCallback((phone: string): string => {
    if (phone.length <= 3) return phone;
    return phone.slice(0, -3) + "***";
  }, []);

  // Auto-dial phone number
  const dialPhoneNumber = useCallback((phoneNumber: string) => {
    const telLink = `tel:${phoneNumber}`;
    window.open(telLink, "_self");
  }, []);

  // Map disposition name dari database ke prospect status
  const mapDispositionToProspectStatus = useCallback(
    (dispositionName: string): string => {
      // Langsung return nama status dari database
      // Karena sekarang kita menggunakan status dinamis dari database
      return dispositionName;
    },
    []
  );

  // Determine if status is considered successful based on database configuration
  const isSuccessfulStatus = useCallback(
    (statusName: string): boolean => {
      // Get the status object from database
      const status = dispositionStatuses.find((s) => s.name === statusName);
      if (!status) return false;

      // Primary check: use the isSuccessful field if it exists
      if (status.isSuccessful !== undefined) {
        return status.isSuccessful;
      }

      // Fallback: Check if the status has positive next actions that indicate success
      const hasSuccessfulNextActions = status.nextActions.some((action) => {
        const actionLower = action.toLowerCase();
        return (
          actionLower.includes("follow") ||
          actionLower.includes("convert") ||
          actionLower.includes("close") ||
          actionLower.includes("sale") ||
          actionLower.includes("deal") ||
          actionLower.includes("contract") ||
          actionLower.includes("agreement")
        );
      });

      // Use priority to determine success (higher priority = more successful)
      // Assuming priorities 1-3 are successful statuses
      const isHighPriority = status.priority <= 3;

      // Check status name for success indicators
      const name = statusName.toLowerCase();
      const hasSuccessfulName =
        name.includes("Respon") || name.includes("Janji telepon");

      // Consider it successful if any of these conditions are met
      return hasSuccessfulNextActions || isHighPriority || hasSuccessfulName;
    },
    [dispositionStatuses]
  );

  // Get disposition options from database
  const getDispositionOptions = useCallback(() => {
    return dispositionStatuses.map((status) => ({
      id: status.id!,
      name: status.name,
      color: status.color,
    }));
  }, [dispositionStatuses]);

  // Auto-start first call helper
  const startFirstCall = useCallback(
    async (session: CallSession, prospects: Prospect[]) => {
      if (prospects.length === 0) return;

      try {
        const firstProspect = prospects[0];

        const callData = {
          sessionId: session.id!,
          prospectId: firstProspect.id!,
          prospectName: firstProspect.name,
          prospectPhone: firstProspect.phone,
          maskedPhone: maskPhoneNumber(firstProspect.phone),
          startTime: Timestamp.now(),
          duration: 0,
          status: "calling" as CallStatus,
          userId: user!.id,
          createdAt: Timestamp.now(),
        };

        const callsRef = collection(db, "call_logs");
        const docRef = await addDoc(callsRef, callData);

        const newCall = { id: docRef.id, ...callData } as CallLog;
        setCurrentCall(newCall);
        setCurrentProspect(firstProspect);
        setCallTimer(0);

        // Auto-dial the phone number
        dialPhoneNumber(firstProspect.phone);

        console.log("Auto-started first call for:", firstProspect.name);
      } catch (err) {
        console.error("Error auto-starting first call:", err);
      }
    },
    [user, maskPhoneNumber, dialPhoneNumber]
  );

  // SOP 3: Mulai sesi dengan timer untuk sesi
  const startSession = useCallback(async () => {
    if (!user?.id) return { success: false, error: "User not authenticated" };

    try {
      setLoading(true);
      setError(null);

      // Sinkronisasi data dari database terlebih dahulu
      const { prospects: availableProspects } = await syncAllData();

      if (availableProspects.length === 0) {
        return {
          success: false,
          error: `No prospects available with status '${prospectFilters.statusName}' from '${prospectFilters.sourceName}' source`,
        };
      }

      // Buat session baru
      const sessionData = {
        userId: user.id,
        startTime: Timestamp.now(),
        status: "active" as SessionStatus,
        totalCalls: availableProspects.length,
        completedCalls: 0,
        successfulCalls: 0,
        duration: 0,
        breaks: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const sessionsRef = collection(db, "call_sessions");
      const docRef = await addDoc(sessionsRef, sessionData);

      const newSession = { id: docRef.id, ...sessionData } as CallSession;
      setCurrentSession(newSession);
      setCallQueue(availableProspects);
      setSessionTimer(0);

      console.log("🚀 Session started:", {
        sessionId: docRef.id,
        prospects: availableProspects.length,
        timestamp: new Date().toISOString(),
      });

      // Auto-start first call setelah session dimulai
      setTimeout(async () => {
        await startFirstCall(newSession, availableProspects);
      }, 500);

      return { success: true, sessionId: docRef.id };
    } catch (err) {
      console.error("Error starting session:", err);
      setError("Failed to start session");
      return { success: false, error: "Failed to start session" };
    } finally {
      setLoading(false);
    }
  }, [user?.id, syncAllData, startFirstCall]);

  // Start break
  const startBreak = useCallback(
    async (reason?: string) => {
      if (!currentSession)
        return { success: false, error: "No active session" };

      try {
        const newBreak: Break = {
          startTime: Timestamp.now(),
          reason,
        };

        const updatedBreaks = [...(currentSession.breaks || []), newBreak];
        const sessionRef = doc(db, "call_sessions", currentSession.id!);

        await updateDoc(sessionRef, {
          status: "break",
          breaks: updatedBreaks,
          updatedAt: Timestamp.now(),
        });

        setCurrentSession((prev) =>
          prev ? { ...prev, status: "break", breaks: updatedBreaks } : null
        );
        setBreakTimer(0);

        return { success: true };
      } catch (err) {
        console.error("Error starting break:", err);
        return { success: false, error: "Failed to start break" };
      }
    },
    [currentSession]
  );

  // End break
  const endBreak = useCallback(async () => {
    if (!currentSession) return { success: false, error: "No active session" };

    try {
      const updatedBreaks = currentSession.breaks.map((breakItem, index) => {
        if (index === currentSession.breaks.length - 1 && !breakItem.endTime) {
          return {
            ...breakItem,
            endTime: Timestamp.now(),
            duration: breakTimer,
          };
        }
        return breakItem;
      });

      const sessionRef = doc(db, "call_sessions", currentSession.id!);

      await updateDoc(sessionRef, {
        status: "active",
        breaks: updatedBreaks,
        updatedAt: Timestamp.now(),
      });

      setCurrentSession((prev) =>
        prev ? { ...prev, status: "active", breaks: updatedBreaks } : null
      );
      setBreakTimer(0);

      return { success: true };
    } catch (err) {
      console.error("Error ending break:", err);
      return { success: false, error: "Failed to end break" };
    }
  }, [currentSession, breakTimer]);

  // Start next call
  const startNextCall = useCallback(async () => {
    if (!currentSession || callQueue.length === 0) {
      return { success: false, error: "No prospects in queue" };
    }

    try {
      const nextProspect = callQueue[0];

      const callData = {
        sessionId: currentSession.id!,
        prospectId: nextProspect.id!,
        prospectName: nextProspect.name,
        prospectPhone: nextProspect.phone,
        maskedPhone: maskPhoneNumber(nextProspect.phone),
        startTime: Timestamp.now(),
        duration: 0,
        status: "calling" as CallStatus,
        userId: user!.id,
        createdAt: Timestamp.now(),
      };

      const callsRef = collection(db, "call_logs");
      const docRef = await addDoc(callsRef, callData);

      const newCall = { id: docRef.id, ...callData } as CallLog;
      setCurrentCall(newCall);
      setCurrentProspect(nextProspect);
      setCallTimer(0);

      // Auto-dial the phone number
      dialPhoneNumber(nextProspect.phone);

      return { success: true, callId: docRef.id };
    } catch (err) {
      console.error("Error starting call:", err);
      return { success: false, error: "Failed to start call" };
    }
  }, [currentSession, callQueue, user, maskPhoneNumber, dialPhoneNumber]);

  // SOP 4: Update status sesuai yang ada di database ketika call disposition diklik
  const endCall = useCallback(
    async (dispositionId: string, notes?: string) => {
      if (!currentCall || !currentProspect) {
        return { success: false, error: "No active call" };
      }

      try {
        // Ambil status dari database yang sudah disinkronisasi
        const selectedDisposition = dispositionStatuses.find(
          (status) => status.id === dispositionId
        );

        if (!selectedDisposition) {
          return {
            success: false,
            error: "Invalid disposition selected from database",
          };
        }

        // Update call log
        const callRef = doc(db, "call_logs", currentCall.id!);
        await updateDoc(callRef, {
          endTime: Timestamp.now(),
          duration: callTimer,
          status: "completed" as CallStatus,
          disposition: selectedDisposition.name,
          notes: notes || "",
          updatedAt: Timestamp.now(),
        });

        // SOP 4: Update prospect status menggunakan status yang ada di database
        // Mapping langsung berdasarkan nama status dari database
        const targetStatus = mapDispositionToProspectStatus(
          selectedDisposition.name
        );

        await updateProspect(currentProspect.id!, { status: targetStatus });

        console.log("📞 Call completed with database status:", {
          dispositionFromDB: selectedDisposition.name,
          mappedStatus: targetStatus,
          prospectId: currentProspect.id,
          prospectName: currentProspect.name,
          source: "database_status",
        });

        // Update session statistics
        const completedCalls = currentSession!.completedCalls + 1;
        const successfulCalls = isSuccessfulStatus(targetStatus)
          ? currentSession!.successfulCalls + 1
          : currentSession!.successfulCalls;

        const sessionRef = doc(db, "call_sessions", currentSession!.id!);
        await updateDoc(sessionRef, {
          completedCalls,
          successfulCalls,
          updatedAt: Timestamp.now(),
        });

        // Update UI state
        const updatedQueue = callQueue.slice(1);
        setCallQueue(updatedQueue);
        setCurrentCall(null);
        setCurrentProspect(null);
        setCallTimer(0);

        setCurrentSession((prev) =>
          prev ? { ...prev, completedCalls, successfulCalls } : null
        );

        // Auto-start next call
        if (updatedQueue.length > 0) {
          setTimeout(async () => {
            await startNextCall();
          }, 1000);
        }

        return { success: true };
      } catch (err) {
        console.error("Error ending call:", err);
        return { success: false, error: "Failed to end call" };
      }
    },
    [
      currentCall,
      currentProspect,
      callTimer,
      currentSession,
      dispositionStatuses,
      updateProspect,
      callQueue,
      startNextCall,
      mapDispositionToProspectStatus,
      isSuccessfulStatus,
    ]
  );

  // End session
  const endSession = useCallback(async () => {
    if (!currentSession) return { success: false, error: "No active session" };

    try {
      const sessionRef = doc(db, "call_sessions", currentSession.id!);

      await updateDoc(sessionRef, {
        endTime: Timestamp.now(),
        status: "ended",
        duration: sessionTimer,
        updatedAt: Timestamp.now(),
      });

      setCurrentSession(null);
      setCurrentCall(null);
      setCurrentProspect(null);
      setCallQueue([]);
      setSessionTimer(0);
      setCallTimer(0);
      setBreakTimer(0);

      return { success: true };
    } catch (err) {
      console.error("Error ending session:", err);
      return { success: false, error: "Failed to end session" };
    }
  }, [currentSession, sessionTimer]);

  // Effect untuk sinkronisasi data saat mount dan ketika filter berubah
  useEffect(() => {
    const shouldSync =
      user?.id &&
      prospects.length > 0 &&
      (!isInitialized.current ||
        prospects.length !== lastProspectsLength.current);

    if (shouldSync) {
      lastProspectsLength.current = prospects.length;
      isInitialized.current = true;
      syncAllData();
    }
  }, [user?.id, prospects.length, syncAllData]); // Trigger ketika user ID, prospects, atau syncAllData berubah

  // Effect untuk re-sync ketika filter berubah
  useEffect(() => {
    if (user?.id && prospects.length > 0 && isInitialized.current) {
      syncAllData();
    }
  }, [prospectFilters.statusName, prospectFilters.sourceName, syncAllData]);

  // Timers
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentSession?.status === "active") {
      interval = setInterval(() => {
        setSessionTimer((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession?.status]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentCall?.status === "calling") {
      interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentCall?.status]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentSession?.status === "break") {
      interval = setInterval(() => {
        setBreakTimer((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession?.status]);

  // Generate random call duration (for simulation)
  const generateRandomCallDuration = useCallback(() => {
    return Math.floor(Math.random() * (180 - 30 + 1)) + 30; // 30-180 seconds
  }, []);

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    // State
    currentSession,
    currentCall,
    currentProspect,
    callQueue,
    callableProspects,
    dispositionStatuses,
    sessionTimer,
    callTimer,
    breakTimer,
    loading,
    error,
    isDataSynced,

    // Actions
    startSession,
    startBreak,
    endBreak,
    startNextCall,
    endCall,
    endSession,
    syncAllData,
    setProspectFilters,

    // Helpers
    maskPhoneNumber,
    dialPhoneNumber,
    getDispositionOptions,
    mapDispositionToProspectStatus,
    isSuccessfulStatus,
    generateRandomCallDuration,
    formatTime,
    prospectFilters,
  };
}
