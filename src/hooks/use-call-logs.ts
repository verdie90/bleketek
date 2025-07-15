import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./use-auth";

export interface CallLog {
  id?: string;
  sessionId?: string;
  prospectId: string;
  prospectName?: string;
  prospectPhone?: string;
  maskedPhone?: string;
  agentId?: string;
  userId?: string;
  phoneNumber?: string;
  status: "completed" | "missed" | "busy" | "no_answer" | "calling" | "answered" | "voicemail";
  duration?: number; // in seconds
  startTime?: Timestamp;
  endTime?: Timestamp;
  disposition?: string;
  notes?: string;
  recordingUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CallLogsFilter {
  agentId?: string;
  userId?: string;
  prospectId?: string;
  status?: string;
  disposition?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

interface User {
  id: string;
  displayName: string;
  email: string;
}

interface Prospect {
  id: string;
  name: string;
  phone?: string;
  phoneNumber?: string;
}

export function useCallLogs() {
  const { user } = useAuth();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
    } catch (err: any) {
    }
  }, []);

  // Load prospects
  const loadProspects = useCallback(async () => {
    try {
      const prospectsQuery = query(collection(db, "prospects"));
      const prospectsSnapshot = await getDocs(prospectsQuery);
      const prospectsData = prospectsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Prospect[];
      setProspects(prospectsData);
    } catch (err: any) {
    }
  }, []);

  // Load call logs
  useEffect(() => {
    if (!user) return;

    const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
    
    const callLogsQuery = query(collection(db, "call_logs"), ...constraints);

    const unsubscribe = onSnapshot(
      callLogsQuery,
      (snapshot) => {
        const callLogsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CallLog[];
        setCallLogs(callLogsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  // Load related data
  useEffect(() => {
    if (user) {
      loadUsers();
      loadProspects();
    }
  }, [user, loadUsers, loadProspects]);

  // Add call log
  const addCallLog = useCallback(
    async (callLogData: Omit<CallLog, "id" | "createdAt" | "updatedAt">) => {
      try {
        const newCallLog = {
          ...callLogData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        await addDoc(collection(db, "call_logs"), newCallLog);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    []
  );

  // Update call log
  const updateCallLog = useCallback(async (id: string, updates: Partial<CallLog>) => {
    try {
      const callLogRef = doc(db, "call_logs", id);
      await updateDoc(callLogRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  // Delete call log
  const deleteCallLog = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "call_logs", id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  // Filter call logs
  const filterCallLogs = useCallback(
    (filter: CallLogsFilter) => {
      return callLogs.filter((callLog) => {
        // Agent filter (check both agentId and userId)
        if (filter.agentId && callLog.agentId !== filter.agentId && callLog.userId !== filter.agentId) {
          return false;
        }

        if (filter.userId && callLog.userId !== filter.userId) {
          return false;
        }

        // Prospect filter
        if (filter.prospectId && callLog.prospectId !== filter.prospectId) {
          return false;
        }

        // Status filter
        if (filter.status && callLog.status !== filter.status) {
          return false;
        }

        // Disposition filter
        if (filter.disposition && callLog.disposition !== filter.disposition) {
          return false;
        }

        // Date range filter
        if (filter.dateFrom && callLog.createdAt) {
          const callDate = callLog.createdAt.toDate();
          if (callDate < filter.dateFrom) {
            return false;
          }
        }

        if (filter.dateTo && callLog.createdAt) {
          const callDate = callLog.createdAt.toDate();
          const endDate = new Date(filter.dateTo);
          endDate.setHours(23, 59, 59, 999);
          if (callDate > endDate) {
            return false;
          }
        }

        // Search filter (phone number, notes, disposition, prospect name)
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          const prospect = prospects.find(p => p.id === callLog.prospectId);
          const user = users.find(u => u.id === (callLog.agentId || callLog.userId));
          
          const searchableText = [
            callLog.phoneNumber || "",
            callLog.prospectPhone || "",
            callLog.maskedPhone || "",
            callLog.notes || "",
            callLog.disposition || "",
            callLog.prospectName || "",
            prospect?.name || "",
            user?.displayName || "",
          ].join(" ").toLowerCase();

          if (!searchableText.includes(searchLower)) {
            return false;
          }
        }

        return true;
      });
    },
    [callLogs, prospects, users]
  );

  return {
    callLogs,
    users,
    prospects,
    loading,
    error,
    addCallLog,
    updateCallLog,
    deleteCallLog,
    filterCallLogs,
  };
}
