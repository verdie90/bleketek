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
  const { getActiveProspectStatuses, getActiveProspectSources, phoneSettings } =
    useTelemarketingSettings();


  // Core session state
  const [currentSession, setCurrentSession] = useState<CallSession | null>(null);
  const [currentCall, setCurrentCall] = useState<CallLog | null>(null);
  const [currentProspect, setCurrentProspect] = useState<Prospect | null>(null);
  // Prospect filters - now loaded from phone settings
  const [prospectFilters, setProspectFilters] = useState<ProspectFilters>({
    statusName: phoneSettings?.defaultStatusFilter || "Baru", // Load from settings
    sourceName: phoneSettings?.defaultSourceFilter || "Database", // Load from settings
  });


  // Database-synced data
  const [callableProspects, setCallableProspects] = useState<Prospect[]>([]);
  const [dispositionStatuses, setDispositionStatuses] = useState<ProspectStatus[]>([]);
  const [callQueue, setCallQueue] = useState<Prospect[]>([]);
  // Timers
  const [sessionTimer, setSessionTimer] = useState(0);
  const [callTimer, setCallTimer] = useState(0);
  const [breakTimer, setBreakTimer] = useState(0);
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDataSynced, setIsDataSynced] = useState(false);

  // Ref untuk menghindari infinite loop
  const lastProspectsLength = useRef(0);
  const isInitialized = useRef(false);
  const prevFiltersRef = useRef(prospectFilters);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mutex/Locking untuk mencegah race condition
  const [isProcessingCall, setIsProcessingCall] = useState(false);
  const isStartingNextCall = useRef(false);
  const isEndingCall = useRef(false);

  // Helper function to get consistent user ID
  const getCurrentUserId = useCallback((): string => {
    console.log("🔍 getCurrentUserId called with user:", {
      user,
      userType: typeof user,
      userKeys: user ? Object.keys(user) : null,
      userId: user?.id,
      userUid: (user as any)?.uid,
      userEmail: user?.email,
      userUsername: user?.username
    });
    
    if (!user) {
      console.warn("⚠️ No user object available");
      return "";
    }
    
    // Try different possible user ID fields in priority order
    // 1. id field (primary)
    // 2. email (fallback - unique identifier)
    // 3. username (secondary fallback)
    // 4. uid (for Firebase compatibility)
    let id = user.id || user.email || user.username || (user as any).uid || "";
    
    // Last resort: if still no ID, create a temporary one based on user data
    if (!id && user.fullName) {
      id = `user_${user.fullName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
      console.warn("⚠️ Using generated temporary user ID:", id);
    }
    
    console.log("🔍 getCurrentUserId returning:", id);
    return id;
  }, [user]);

  // Debug useEffect to monitor user changes
  useEffect(() => {
    console.log("🔍 User object changed in use-call-session:", {
      user,
      isAuthenticated: !!user,
      userId: user?.id,
      userEmail: user?.email,
      fullName: user?.fullName
    });
  }, [user]);

  // SOP 5: Helper functions menggunakan sumber database

  // SOP: Sinkronisasi semua data dari database
  const syncAllData = useCallback(async () => {
    try {
      // Get all active statuses and sources from database
      const statuses = getActiveProspectStatuses();
      const sources = getActiveProspectSources();

      // Auto-adjust filters if current values don't exist in available options
      const currentStatusExists = statuses.some(s => s.name === prospectFilters.statusName);
      const currentSourceExists = sources.some(s => s.name === prospectFilters.sourceName);

      if (!currentStatusExists || !currentSourceExists) {
        console.warn("🔄 Current filter values don't exist, auto-adjusting:", {
          currentStatus: prospectFilters.statusName,
          currentSource: prospectFilters.sourceName,
          statusExists: currentStatusExists,
          sourceExists: currentSourceExists,
          availableStatuses: statuses.map(s => s.name),
          availableSources: sources.map(s => s.name),
        });

        const newFilters = {
          statusName: currentStatusExists ? prospectFilters.statusName : (statuses[0]?.name || "Baru"),
          sourceName: currentSourceExists ? prospectFilters.sourceName : (sources[0]?.name || "Database"),
        };

        setProspectFilters(newFilters);
        console.log("🔄 Auto-adjusted filters to:", newFilters);
      }

      // Only update disposition statuses if they've changed
      if (JSON.stringify(statuses) !== JSON.stringify(dispositionStatuses)) {
        setDispositionStatuses(statuses);
        console.log("📊 Updated disposition statuses:", {
          count: statuses.length,
          statuses: statuses.map((s) => s.name),
        });
      }

      // Find selected source from telemarketing_prospect_sources collection
      const selectedSource = sources.find(
        (source) => source.name === prospectFilters.sourceName
      );

      console.log("🔍 Source matching debug:", {
        lookingFor: prospectFilters.sourceName,
        availableSources: sources.map(s => s.name),
        foundSource: selectedSource ? selectedSource.name : 'NOT FOUND'
      });

      if (!selectedSource) {
        console.warn(
          `No '${prospectFilters.sourceName}' source found in telemarketing_prospect_sources`
        );
        console.log("Available sources:", sources.map(s => ({ id: s.id, name: s.name })));


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

        // (Removed duplicate prospectFilters declaration)

        // Firestore listeners for session and call logs
        useEffect(() => {
          if (!user || !('uid' in user)) return;
          setLoading(true);
          // Listen for current session for this user
          const sessionQuery = query(
            collection(db, "call_sessions"),
            where("userId", "==", (user as any).uid),
            orderBy("startTime", "desc"),
            limit(1)
          );
          const unsubscribeSession = onSnapshot(sessionQuery, (snapshot) => {
            if (!snapshot.empty) {
              const sessionData = snapshot.docs[0].data() as CallSession;
              setCurrentSession({ ...sessionData, id: snapshot.docs[0].id });
            } else {
              setCurrentSession(null);
            }
            setLoading(false);
          });
          return () => unsubscribeSession();
        }, [user]);

        // Listen for current call log for this session - with protection for auto call
        useEffect(() => {
          if (!currentSession) return;
          
          const callQuery = query(
            collection(db, "call_logs"),
            where("sessionId", "==", currentSession.id),
            orderBy("startTime", "desc"),
            limit(1)
          );
          const unsubscribeCall = onSnapshot(callQuery, (snapshot) => {
            // Skip listener updates during call processing to prevent data conflicts
            if (isProcessingCall || isStartingNextCall.current || isEndingCall.current) {
              console.log("⏸️ Ignoring call listener update during processing");
              return;
            }
            
            if (!snapshot.empty) {
              const callData = snapshot.docs[0].data() as CallLog;
              const newCall = { ...callData, id: snapshot.docs[0].id };
              
              // Only update if it's actually a different call
              if (!currentCall || currentCall.id !== newCall.id) {
                console.log("📞 Call listener: New call detected:", {
                  callId: newCall.id,
                  prospectName: newCall.prospectName
                });
                setCurrentCall(newCall);
              }
            } else {
              if (currentCall) {
                console.log("📞 Call listener: No active call");
                setCurrentCall(null);
              }
            }
          });
          return () => unsubscribeCall();
        }, [currentSession, isProcessingCall]);

        // Listen for current prospect (the one being called) - with protection for auto call
        useEffect(() => {
          if (!currentCall) return;
          
          const prospectId = currentCall.prospectId;
          const prospectRef = doc(db, "prospects", prospectId);
          const unsubscribeProspect = onSnapshot(prospectRef, (docSnap) => {
            // Skip listener updates during call processing to prevent data conflicts
            if (isProcessingCall || isStartingNextCall.current || isEndingCall.current) {
              console.log("⏸️ Ignoring prospect listener update during processing");
              return;
            }
            
            if (docSnap.exists()) {
              const prospectData = { ...docSnap.data(), id: docSnap.id } as Prospect;
              
              // Only update if it's actually a different prospect or significant change
              if (!currentProspect || currentProspect.id !== prospectData.id || 
                  currentProspect.status !== prospectData.status) {
                console.log("👤 Prospect listener: Prospect data updated:", {
                  prospectId: prospectData.id,
                  prospectName: prospectData.name,
                  status: prospectData.status
                });
                setCurrentProspect(prospectData);
              }
            } else {
              if (currentProspect) {
                console.log("👤 Prospect listener: Prospect no longer exists");
                setCurrentProspect(null);
              }
            }
          });
          return () => unsubscribeProspect();
        }, [currentCall, isProcessingCall]);

        // Listen for callable prospects (filtered by status/source/phone)
        useEffect(() => {
          // This logic is already handled in useProspects, so just filter here
          // Optionally, you could move this to Firestore query for large datasets
          // For now, keep as is for simplicity
        }, []);

        // Remove all debug and sync state logic for production

        // ...existing code...

        // Don't return early, continue with filtering using the sourceName directly
        // This allows filtering even if the source isn't in the settings table
      }

      // Enhanced debugging for prospects filtering
      console.log("🔍 Detailed filtering debug:", {
        totalProspects: prospects.length,
        filterCriteria: {
          statusName: prospectFilters.statusName,
          sourceName: prospectFilters.sourceName,
        },
        availableSources: sources.map(s => ({ id: s.id, name: s.name })),
        selectedSource: selectedSource ? { id: selectedSource.id, name: selectedSource.name } : null,
        prospectSamples: prospects.slice(0, 3).map(p => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          status: p.status,
          source: p.source,
        })),
      });

      // Filter prospects: berdasarkan filter yang dipilih user
      const filtered = prospects.filter((prospect) => {
        // 1. Harus memiliki nomor telepon (check both phone and phoneNumber fields)
        const hasPhone = Boolean(prospect.phone || prospect.phoneNumber);

        // 2. Status harus sesuai dengan filter yang dipilih (with null safety)
        const statusMatch = prospect.status && prospect.status === prospectFilters.statusName;

        // 3. Source harus sesuai dengan filter yang dipilih (with null safety)
        const sourceMatch = prospect.source && prospect.source === prospectFilters.sourceName;

        const passed = hasPhone && statusMatch && sourceMatch;

        // Log setiap prospect untuk debugging
        if (prospects.indexOf(prospect) < 5) { // Log only first 5 for performance
          console.log("🔍 Filtering prospect:", {
            name: prospect.name,
            hasPhone,
            phoneValue: prospect.phone || prospect.phoneNumber || 'None',
            statusMatch,
            sourceMatch,
            prospectStatus: prospect.status || 'null',
            prospectSource: prospect.source || 'null',
            targetStatus: prospectFilters.statusName,
            targetSource: prospectFilters.sourceName,
            passed,
          });
        }

        return passed;
      });

      // Only update state if data has actually changed
      const currentProspectsJson = JSON.stringify(callableProspects.map(p => p.id).sort());
      const newProspectsJson = JSON.stringify(filtered.map(p => p.id).sort());

      if (currentProspectsJson !== newProspectsJson) {
        setCallableProspects(filtered);
        console.log("📋 Updated callable prospects:", {
          total: prospects.length,
          callable: filtered.length,
          criteria: `status=${prospectFilters.statusName}, source=${prospectFilters.sourceName} (from collection)`,
          targetStatus: prospectFilters.statusName,
          selectedSourceId: selectedSource?.id || 'unknown',
          changed: true,
          previousCount: callableProspects.length,
          newCount: filtered.length,
          breakdown: {
            totalProspects: prospects.length,
            withPhone: prospects.filter((p) => p.phone || p.phoneNumber).length,
            withPhoneDetails: {
              phoneField: prospects.filter((p) => p.phone).length,
              phoneNumberField: prospects.filter((p) => p.phoneNumber).length,
              either: prospects.filter((p) => p.phone || p.phoneNumber).length,
            },
            statusMatch: prospects.filter(
              (p) => p.status && p.status === prospectFilters.statusName
            ).length,
            sourceMatch: prospects.filter(
              (p) => p.source && p.source === prospectFilters.sourceName
            ).length,
            bothConditions: prospects.filter(
              (p) =>
                p.status && p.status === prospectFilters.statusName &&
                p.source && p.source === prospectFilters.sourceName
            ).length,
            fullMatch: prospects.filter(
              (p) =>
                (p.phone || p.phoneNumber) &&
                p.status && p.status === prospectFilters.statusName &&
                p.source && p.source === prospectFilters.sourceName
            ).length,
            sampleProspects: prospects.slice(0, 3).map(p => ({
              name: p.name,
              phone: p.phone || 'none',
              phoneNumber: p.phoneNumber || 'none',
              status: p.status || 'none',
              source: p.source || 'none',
            })),
          },
        });
      } else {
        console.log("📋 Prospects unchanged, skipping update:", {
          count: filtered.length,
          criteria: `status=${prospectFilters.statusName}, source=${prospectFilters.sourceName}`,
        });
      }

      return { prospects: filtered, statuses };
    } catch (err) {
      console.error("Error syncing data:", err);
      setError("Failed to sync data");
      return { prospects: [], statuses: [] };
    }
  }, [
    prospects,
    getActiveProspectStatuses,
    getActiveProspectSources,
    prospectFilters,
  ]);

  // Calculate real-time session duration from start time
  const getSessionDuration = useCallback((): number => {
    if (!currentSession?.startTime) return 0;

    const now = new Date().getTime();
    const startTime = currentSession.startTime.toDate().getTime();
    const durationInSeconds = Math.floor((now - startTime) / 1000);

    return Math.max(0, durationInSeconds);
  }, [currentSession?.startTime]);

  // Debounced sync function to prevent rapid successive calls
  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncAllData();
      syncTimeoutRef.current = null;
    }, 300); // 300ms debounce
  }, [syncAllData]);

  // Mask phone number (hide last 3 digits)
  const maskPhoneNumber = useCallback((phone: string): string => {
    if (phone.length <= 3) return phone;
    return phone.slice(0, -3) + "***";
  }, []);

  // Auto-dial phone number (only if enabled in settings)
  const dialPhoneNumber = useCallback((phoneNumber: string) => {
    // Check if auto dial is enabled in settings
    if (phoneSettings?.autoDialEnabled !== true) {
      console.log("📞 Auto dial disabled in settings, skipping dial for:", phoneNumber);
      return;
    }

    console.log("📞 Auto dialing:", phoneNumber, "(auto dial enabled)");
    const telLink = `tel:${phoneNumber}`;
    window.open(telLink, "_self");
  }, [phoneSettings?.autoDialEnabled]);

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
        const phoneNumber = firstProspect.phone || firstProspect.phoneNumber; // Support both phone fields

        const callData = {
          sessionId: session.id!,
          prospectId: firstProspect.id!,
          prospectName: firstProspect.name,
          prospectPhone: phoneNumber,
          maskedPhone: maskPhoneNumber(phoneNumber),
          startTime: Timestamp.now(),
          duration: 0,
          status: "calling" as CallStatus,
          userId: getCurrentUserId(),
          createdAt: Timestamp.now(),
        };

        const callsRef = collection(db, "call_logs");
        const docRef = await addDoc(callsRef, callData);

        const newCall = { id: docRef.id, ...callData } as CallLog;
        setCurrentCall(newCall);
        setCurrentProspect(firstProspect);
        setCallTimer(0);

        // Auto-dial the phone number (if enabled in settings)
        dialPhoneNumber(phoneNumber);

        console.log("Auto-started first call:", {
          prospect: firstProspect.name,
          phone: phoneNumber,
          autoDialEnabled: phoneSettings?.autoDialEnabled,
          session: session.id
        });
      } catch (err) {
        console.error("Error auto-starting first call:", err);
      }
    },
    [user, maskPhoneNumber, dialPhoneNumber, getCurrentUserId]
  );

  // SOP 3: Mulai sesi dengan timer untuk sesi
  const startSession = useCallback(async () => {
    if (!getCurrentUserId()) return { success: false, error: "User not authenticated" };

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
        userId: getCurrentUserId(),
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
  }, [getCurrentUserId, syncAllData, startFirstCall]);

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
    // Prevent race condition - check if already starting a call
    if (isStartingNextCall.current || isProcessingCall) {
      console.log("⏸️ startNextCall blocked - already processing");
      return { success: false, error: "Already processing call" };
    }

    if (!currentSession) {
      return { success: false, error: "No active session" };
    }

    // Set locking flags
    isStartingNextCall.current = true;
    setIsProcessingCall(true);

    try {
      // Refresh callable prospects sebelum start next call
      console.log("🔄 Refreshing callable prospects before next call...");
      await syncAllData();

      // Get next prospect - prioritas: queue yang sudah difilter > callable prospects baru
      let nextProspect = null;
      let updatedQueue = [...callQueue]; // Copy current queue
      
      console.log("🔍 startNextCall debug:", {
        currentSession: !!currentSession,
        callQueueLength: callQueue.length,
        callableProspectsLength: callableProspects.length,
        currentProspect: currentProspect ? { id: currentProspect.id, name: currentProspect.name } : null
      });
      
      // Remove current prospect from queue if it's still there
      if (currentProspect) {
        updatedQueue = callQueue.filter(p => p.id !== currentProspect.id);
      }
      
      // Check if we have prospects in filtered queue
      if (updatedQueue.length > 0) {
        nextProspect = updatedQueue[0];
        console.log("✅ Using next prospect from filtered queue:", { 
          id: nextProspect?.id, 
          name: nextProspect?.name,
          queueLength: updatedQueue.length 
        });
      } else if (callableProspects.length > 0) {
        // If no prospect from queue, get from callable prospects (excluding current)
        const availableProspects = callableProspects.filter(p => 
          !currentProspect || p.id !== currentProspect.id
        );
        
        if (availableProspects.length > 0) {
          nextProspect = availableProspects[0];
          updatedQueue = availableProspects;
          console.log("🔄 Using prospect from callable prospects:", {
            total: availableProspects.length,
            first: { id: nextProspect.id, name: nextProspect.name }
          });
        }
      }

      if (!nextProspect) {
        console.log("❌ No prospects available for calling");
        return { success: false, error: "No prospects available for calling" };
      }

      // Validate prospect has required data
      if (!nextProspect.id || !nextProspect.name) {
        console.error("❌ Invalid prospect data:", nextProspect);
        return { success: false, error: "Invalid prospect data" };
      }

      const phoneNumber = nextProspect.phone || nextProspect.phoneNumber || "";
      
      if (!phoneNumber) {
        console.error("❌ Prospect has no phone number:", nextProspect);
        return { success: false, error: "Prospect has no phone number" };
      }

      // Create call log entry
      const callData = {
        sessionId: currentSession.id!,
        prospectId: nextProspect.id,
        prospectName: nextProspect.name,
        prospectPhone: phoneNumber,
        maskedPhone: maskPhoneNumber(phoneNumber),
        startTime: Timestamp.now(),
        duration: 0,
        status: "calling" as CallStatus,
        userId: getCurrentUserId(),
        createdAt: Timestamp.now(),
      };

      const callsRef = collection(db, "call_logs");
      const docRef = await addDoc(callsRef, callData);

      // Update state immediately and atomically to prevent conflicts
      const newCall = { id: docRef.id, ...callData } as CallLog;
      
      // CRITICAL: Update all state together in batch to prevent inconsistency
      setCurrentCall(newCall);
      setCurrentProspect(nextProspect);
      setCallQueue(updatedQueue);
      setCallTimer(0);

      // Auto-dial the phone number (if enabled in settings)
      dialPhoneNumber(phoneNumber);

      console.log("✅ Started next call successfully:", {
        prospectId: nextProspect.id,
        prospectName: nextProspect.name,
        phone: phoneNumber,
        autoDialEnabled: phoneSettings?.autoDialEnabled,
        sessionId: currentSession.id,
        remainingInQueue: updatedQueue.length - 1
      });

      return { success: true, callId: docRef.id };
    } catch (err) {
      console.error("❌ Error starting call:", err);
      return { success: false, error: "Failed to start call" };
    } finally {
      // Release locking flags
      isStartingNextCall.current = false;
      setIsProcessingCall(false);
    }
  }, [currentSession, callQueue, callableProspects, currentProspect, user, maskPhoneNumber, dialPhoneNumber, phoneSettings, syncAllData, isProcessingCall, getCurrentUserId]);

  // SOP 4: Update status dan assignedTo prospect sesuai yang ada di database ketika call disposition diklik
  const endCall = useCallback(
    async (dispositionId: string, notes?: string) => {
      // Prevent race condition - check if already ending a call
      if (isEndingCall.current || isProcessingCall) {
        console.log("⏸️ endCall blocked - already processing");
        return { success: false, error: "Already processing call" };
      }

      // Set locking flags
      isEndingCall.current = true;
      setIsProcessingCall(true);

      // Debug log for user ID
      console.log("🔍 endCall - User ID debug:", {
        currentUserId: getCurrentUserId(),
        userObject: user,
        userAvailable: !!user
      });
      
      console.log("🔍 endCall - Initial state:", {
        dispositionId,
        notes,
        currentCallId: currentCall?.id,
        currentProspectId: currentProspect?.id,
        currentProspectName: currentProspect?.name,
        currentProspectAssignedTo: currentProspect?.assignedTo,
        callQueueLength: callQueue.length,
        callableProspectsLength: callableProspects.length
      });

      try {
        // Find the disposition from database
        const selectedDisposition = dispositionStatuses.find(
          (status) => status.id === dispositionId
        );

        if (!selectedDisposition) {
          return {
            success: false,
            error: "Invalid disposition selected from database",
          };
        }

        // Get target prospect (priority: currentProspect > callQueue > callableProspects)
        let targetProspect = currentProspect;
        if (!targetProspect && callQueue.length > 0) {
          targetProspect = callQueue[0];
        }
        if (!targetProspect && callableProspects.length > 0) {
          targetProspect = callableProspects[0];
        }

        console.log("🔍 endCall debug - target prospect:", {
          hasCurrentProspect: !!currentProspect,
          callQueueLength: callQueue.length,
          callableProspectsLength: callableProspects.length,
          targetProspect: targetProspect ? { 
            id: targetProspect.id, 
            name: targetProspect.name,
            hasPhone: !!(targetProspect.phone || targetProspect.phoneNumber)
          } : null
        });

        if (!targetProspect) {
          return { success: false, error: "No prospect available to process disposition" };
        }

        // Validate target prospect has required fields
        if (!targetProspect.id || !targetProspect.name) {
          console.error("Invalid target prospect:", targetProspect);
          return { success: false, error: "Invalid prospect data - missing ID or name" };
        }

        // If there's an active call, update the call log
        if (currentCall && currentCall.id) {
          const callRef = doc(db, "call_logs", currentCall.id);
          await updateDoc(callRef, {
            endTime: Timestamp.now(),
            duration: callTimer,
            status: "completed" as CallStatus,
            disposition: selectedDisposition.name,
            notes: notes || "",
            updatedAt: Timestamp.now(),
          });
        } else {
          // Create a call log entry even if there wasn't an active call
          // This ensures we have a record of the disposition
          if (currentSession && currentSession.id) {
            const phoneNumber = targetProspect.phone || targetProspect.phoneNumber || "";
            const callLogData = {
              sessionId: currentSession.id,
              prospectId: targetProspect.id,
              prospectName: targetProspect.name,
              prospectPhone: phoneNumber,
              maskedPhone: maskPhoneNumber(phoneNumber),
              startTime: Timestamp.now(),
              endTime: Timestamp.now(),
              duration: 0, // No actual call duration
              status: "completed" as CallStatus,
              disposition: selectedDisposition.name,
              notes: notes || "",
              userId: getCurrentUserId(),
              createdAt: Timestamp.now(),
            };

            await addDoc(collection(db, "call_logs"), callLogData);
          }
        }

        // Update prospect status and assignedTo field
        const targetStatus = mapDispositionToProspectStatus(selectedDisposition.name);
        
        // Debug user object structure
        console.log("🔍 User object debug:", {
          user,
          userType: typeof user,
          userKeys: user ? Object.keys(user) : null,
          hasId: user ? 'id' in user : false,
          hasUid: user ? 'uid' in user : false,
          userId: user?.id,
          userUid: (user as any)?.uid
        });
        
        // Get user ID - try multiple possible fields
        const userId = getCurrentUserId();
        
        if (!userId) {
          console.error("❌ No valid user ID available for assignment");
          return { success: false, error: "No user authenticated for assignment" };
        }
        
        const updateData: Partial<Prospect> = { 
          status: targetStatus,
          assignedTo: userId // Assign prospect to the agent who made the call
        };
        
        console.log("📝 Updating prospect with data:", updateData);
        const updateResult = await updateProspect(targetProspect.id, updateData);
        
        if (!updateResult.success) {
          console.error("❌ Failed to update prospect:", updateResult.error);
          return { success: false, error: `Failed to update prospect: ${updateResult.error}` };
        }
        
        console.log("✅ Prospect updated successfully with status and assignedTo");

        console.log("📞 Call/Disposition completed:", {
          dispositionFromDB: selectedDisposition.name,
          mappedStatus: targetStatus,
          prospectId: targetProspect.id,
          prospectName: targetProspect.name,
          assignedTo: userId,
          userObjectAvailable: !!user,
          hadActiveCall: !!currentCall,
          source: "database_status",
        });

        // Update session statistics if session exists
        if (currentSession && currentSession.id) {
          const completedCalls = currentSession.completedCalls + 1;
          const successfulCalls = isSuccessfulStatus(targetStatus)
            ? currentSession.successfulCalls + 1
            : currentSession.successfulCalls;

          const sessionRef = doc(db, "call_sessions", currentSession.id);
          await updateDoc(sessionRef, {
            completedCalls,
            successfulCalls,
            updatedAt: Timestamp.now(),
          });

          setCurrentSession((prev) =>
            prev ? { ...prev, completedCalls, successfulCalls } : null
          );
        }

        // Update UI state - clear current call and prospect SETELAH semua database operations selesai
        setCurrentCall(null);
        setCurrentProspect(null);
        setCallTimer(0);

        // Refresh callable prospects setelah disposisi
        console.log("🔄 Refreshing callable prospects after disposition...");
        await syncAllData();

        // Update call queue - remove the processed prospect secara konsisten
        let shouldStartNextCall = false;
        let nextQueue = [...callQueue]; // Copy queue

        // Remove processed prospect from queue
        nextQueue = callQueue.filter(p => p.id !== targetProspect.id);
        console.log("🔄 Filtered processed prospect from queue:", {
          processed: targetProspect.name,
          originalQueueLength: callQueue.length,
          newQueueLength: nextQueue.length
        });

        // Update queue state immediately
        setCallQueue(nextQueue);

        // Determine if we should start next call
        if (nextQueue.length > 0) {
          shouldStartNextCall = true;
          console.log("✅ Will start next call from queue:", {
            nextProspect: nextQueue[0].name,
            queueLength: nextQueue.length
          });
        } else if (callableProspects.length > 1) {
          // Rebuild queue from remaining callable prospects (excluding processed one)
          const remainingProspects = callableProspects.filter(p => p.id !== targetProspect.id);
          if (remainingProspects.length > 0) {
            setCallQueue(remainingProspects);
            shouldStartNextCall = true;
            console.log("🔄 Rebuilt queue from remaining prospects:", {
              total: remainingProspects.length,
              nextProspect: remainingProspects[0].name
            });
          }
        }

        // Auto-start next call if enabled in settings and there are more prospects
        if (shouldStartNextCall && phoneSettings?.autoNextCall && currentSession?.status === "active") {
          const delayMs = (phoneSettings?.callDelaySeconds || 1) * 1000;
          console.log(`🔄 Auto next call scheduled in ${delayMs}ms`);
          
          setTimeout(async () => {
            try {
              // Reset locking flag sebelum next call
              isEndingCall.current = false;
              setIsProcessingCall(false);
              
              const result = await startNextCall();
              if (!result.success) {
                console.log("❌ Auto next call failed:", result.error);
              } else {
                console.log("✅ Auto next call started successfully");
              }
            } catch (error) {
              console.error("❌ Error in auto next call:", error);
              // Reset locking flags on error
              isEndingCall.current = false;
              setIsProcessingCall(false);
            }
          }, delayMs);
        } else {
          console.log("ℹ️ Auto next call skipped:", {
            shouldStartNextCall,
            autoNextCallEnabled: phoneSettings?.autoNextCall,
            sessionActive: currentSession?.status === "active",
            queueLength: nextQueue.length,
            callableProspects: callableProspects.length
          });
          
          // Reset locking flags if not auto calling
          isEndingCall.current = false;
          setIsProcessingCall(false);
        }

        return { success: true };
      } catch (err) {
        console.error("Error ending call/processing disposition:", err);
        return { success: false, error: "Failed to process disposition" };
      } finally {
        // Reset locking flags hanya jika tidak ada auto next call
        if (!phoneSettings?.autoNextCall || currentSession?.status !== "active") {
          isEndingCall.current = false;
          setIsProcessingCall(false);
        }
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
      callableProspects,
      startNextCall,
      mapDispositionToProspectStatus,
      isSuccessfulStatus,
      maskPhoneNumber,
      user,
      phoneSettings,
      syncAllData,
      isProcessingCall,
      getCurrentUserId,
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

  // Helper: filter callable prospects sesuai filter dan field phone/phoneNumber
  const getFilteredCallableProspects = useCallback(() => {
    return prospects.filter(
      (p) =>
        (p.phone || p.phoneNumber) &&
        p.status && p.status === prospectFilters.statusName &&
        p.source && p.source === prospectFilters.sourceName
    );
  }, [prospects, prospectFilters]);

  // Gunakan helper ini untuk update callableProspects setiap kali prospects/filters berubah
  useEffect(() => {
    setCallableProspects(getFilteredCallableProspects());
  }, [getFilteredCallableProspects]);

  // Effect untuk sinkronisasi data saat mount dan ketika prospects berubah
  useEffect(() => {
    const shouldSync =
      user?.id &&
      prospects.length > 0 &&
      (!isInitialized.current ||
        prospects.length !== lastProspectsLength.current);

    if (shouldSync) {
      console.log("🔄 Syncing data due to initialization or prospects change");
      lastProspectsLength.current = prospects.length;
      isInitialized.current = true;
      debouncedSync();
    }
  }, [user?.id, prospects.length, debouncedSync]);

  // --- FIX: Only sync on init, prospects count change, or filter change ---
  // Remove callableProspects and setProspectFilters from syncAllData dependencies
  // Only depend on: prospects, getActiveProspectStatuses, getActiveProspectSources, prospectFilters
  useEffect(() => {
    if (!user?.id) return;
    if (prospects.length !== lastProspectsLength.current) {
      lastProspectsLength.current = prospects.length;
      debouncedSync();
    }
  }, [user?.id, prospects.length, debouncedSync]);

  // In useEffect for filter, only sync if filter value benar-benar berubah
  useEffect(() => {
    if (!user?.id) return;
    if (
      prevFiltersRef.current.statusName !== prospectFilters.statusName ||
      prevFiltersRef.current.sourceName !== prospectFilters.sourceName
    ) {
      prevFiltersRef.current = prospectFilters;
      debouncedSync();
    }
  }, [user?.id, prospectFilters.statusName, prospectFilters.sourceName, debouncedSync]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Real-time listener for current session updates
  useEffect(() => {
    if (!currentSession?.id) return;

    console.log("🔗 Setting up real-time listener for session:", currentSession.id);

    const sessionRef = doc(db, "call_sessions", currentSession.id);
    const unsubscribe = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const sessionData = doc.data();
        const updatedSession = {
          ...currentSession,
          ...sessionData,
          id: doc.id,
          startTime: sessionData.startTime,
          endTime: sessionData.endTime,
          createdAt: sessionData.createdAt,
          updatedAt: sessionData.updatedAt,
        } as CallSession;

        console.log("📊 Session updated from database:", {
          sessionId: doc.id,
          completedCalls: sessionData.completedCalls,
          successfulCalls: sessionData.successfulCalls,
          status: sessionData.status,
        });

        setCurrentSession(updatedSession);
      }
    }, (error) => {
      console.error("Error listening to session updates:", error);
    });

    return () => {
      console.log("🔌 Cleaning up session listener");
      unsubscribe();
    };
  }, [currentSession?.id]);

  // Load existing active session on mount
  useEffect(() => {
    const loadActiveSession = async () => {
      if (!user?.id || currentSession) return; // Don't load if already have session

      try {
        console.log("🔍 Checking for existing active session...");

        const sessionsRef = collection(db, "call_sessions");
        const q = query(
          sessionsRef,
          where("userId", "==", user.id),
          where("status", "in", ["active", "break"]),
          orderBy("startTime", "desc"),
          limit(1)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const sessionDoc = snapshot.docs[0];
          const sessionData = sessionDoc.data();
          const activeSession = {
            id: sessionDoc.id,
            ...sessionData,
          } as CallSession;

          console.log("✅ Found existing active session:", {
            sessionId: activeSession.id,
            status: activeSession.status,
            startTime: activeSession.startTime?.toDate(),
            completedCalls: activeSession.completedCalls,
          });

          setCurrentSession(activeSession);
        } else {
          console.log("ℹ️ No existing active session found");
        }
      } catch (error) {
        console.error("Error loading active session:", error);
      }
    };

    loadActiveSession();
  }, [user?.id, currentSession]); // Include currentSession to prevent reloading

  // Timers - Update session timer based on real database time
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentSession?.status === "active") {
      // Update session timer based on actual start time from database
      const updateTimer = () => {
        const actualDuration = getSessionDuration();
        setSessionTimer(actualDuration);
      };

      // Update immediately
      updateTimer();

      // Then update every second
      interval = setInterval(updateTimer, 1000);
    } else {
      // Reset timer when session is not active
      setSessionTimer(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession?.status, getSessionDuration]);

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

  // Get comprehensive session statistics
  const getSessionStats = useCallback(() => {
    if (!currentSession) {
      return {
        isActive: false,
        duration: 0,
        completedCalls: 0,
        totalCalls: 0,
        status: "idle" as SessionStatus,
        successfulCalls: 0,
      };
    }

    return {
      isActive: currentSession.status === "active" || currentSession.status === "break",
      duration: getSessionDuration(),
      completedCalls: currentSession.completedCalls || 0,
      totalCalls: currentSession.totalCalls || 0,
      status: currentSession.status,
      successfulCalls: currentSession.successfulCalls || 0,
    };
  }, [currentSession, getSessionDuration]);

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

  // Update prospect filters when phone settings change
  useEffect(() => {
    if (phoneSettings?.defaultStatusFilter && phoneSettings?.defaultSourceFilter) {
      setProspectFilters({
        statusName: phoneSettings.defaultStatusFilter,
        sourceName: phoneSettings.defaultSourceFilter,
      });
      console.log("📱 Updated prospect filters from phone settings:", {
        status: phoneSettings.defaultStatusFilter,
        source: phoneSettings.defaultSourceFilter,
      });
    }
  }, [phoneSettings?.defaultStatusFilter, phoneSettings?.defaultSourceFilter]);

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
    phoneSettings,
    isProcessingCall, // Add processing status

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
    getSessionStats,
    getSessionDuration,
  };
}
