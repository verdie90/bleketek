"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Interfaces
export interface ProspectSource {
  id?: string;
  name: string;
  description: string;
  isActive: boolean;
  color: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ProspectStatus {
  id?: string;
  name: string;
  isActive: boolean;
  color: string;
  priority: number;
  isDefault: boolean;
  isSuccessful?: boolean; // Indicates if this status represents a successful outcome
  nextActions: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface PhoneSettings {
  id?: string;
  callDurationMin: number;
  callDurationMax: number;
  dailyCallLimit: number;
  weeklyCallLimit: number;
  monthlyCallLimit: number;
  workingHours: {
    start: string;
    end: string;
    timezone: string;
  };
  workingDays: string[];
  autoDialEnabled: boolean;
  recordCallsEnabled: boolean;
  voicemailDetection: boolean;
  callBackDelay: number; // minutes
  maxCallAttempts: number;
  blacklistedNumbers: string[];
  allowedAreaCodes: string[];
  callerIdSettings: {
    displayName: string;
    phoneNumber: string;
    enabled: boolean;
  };
  // New settings for call automation
  callDelaySeconds: number; // Jeda antar call dalam detik
  autoNextCall: boolean; // Auto call ke prospect berikutnya
  defaultStatusFilter: string; // Default prospect status filter
  defaultSourceFilter: string; // Default prospect source filter
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TelemarketingActivity {
  id?: string;
  type: "prospect_source" | "prospect_status" | "phone_settings";
  action: "create" | "update" | "delete" | "activate" | "deactivate";
  targetId: string;
  targetName: string;
  description: string;
  userEmail: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export function useTelemarketingSettings() {
  // State
  const [prospectSources, setProspectSources] = useState<ProspectSource[]>([]);
  const [prospectStatuses, setProspectStatuses] = useState<ProspectStatus[]>(
    []
  );
  const [phoneSettings, setPhoneSettings] = useState<PhoneSettings | null>(
    null
  );
  const [activities, setActivities] = useState<TelemarketingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Collections
  const prospectSourcesRef = collection(db, "telemarketing_prospect_sources");
  const prospectStatusesRef = collection(db, "telemarketing_prospect_statuses");
  const phoneSettingsRef = collection(db, "telemarketing_phone_settings");
  const activitiesRef = collection(db, "telemarketing_activities");

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load prospect sources
      const sourcesQuery = query(
        prospectSourcesRef,
        orderBy("priority", "asc")
      );
      const sourcesSnapshot = await getDocs(sourcesQuery);
      const sourcesData = sourcesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ProspectSource[];

      // Load prospect statuses
      const statusesQuery = query(
        prospectStatusesRef,
        orderBy("priority", "asc")
      );
      const statusesSnapshot = await getDocs(statusesQuery);
      const statusesData = statusesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ProspectStatus[];

      // Load phone settings
      const phoneSnapshot = await getDocs(phoneSettingsRef);
      const phoneData = phoneSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as PhoneSettings[];

      setProspectSources(sourcesData);
      setProspectStatuses(statusesData);
      setPhoneSettings(phoneData[0] || null);

      // Load recent activities
      const activitiesQuery = query(
        activitiesRef,
        orderBy("timestamp", "desc")
      );
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activitiesData = activitiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as TelemarketingActivity[];

      setActivities(activitiesData);
    } catch (err) {
      setError("Failed to load telemarketing settings");
    } finally {
      setLoading(false);
    }
  };

  // Real-time listeners
  useEffect(() => {
    const unsubscribeSources = onSnapshot(
      query(prospectSourcesRef, orderBy("priority", "asc")),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as ProspectSource[];
        setProspectSources(data);
      }
    );

    const unsubscribeStatuses = onSnapshot(
      query(prospectStatusesRef, orderBy("priority", "asc")),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as ProspectStatus[];
        setProspectStatuses(data);
      }
    );

    const unsubscribePhone = onSnapshot(phoneSettingsRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as PhoneSettings[];
      setPhoneSettings(data[0] || null);
    });

    const unsubscribeActivities = onSnapshot(
      query(activitiesRef, orderBy("timestamp", "desc")),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as TelemarketingActivity[];
        setActivities(data.slice(0, 50)); // Keep only last 50 activities
      }
    );

    // Initial load
    loadData();

    return () => {
      unsubscribeSources();
      unsubscribeStatuses();
      unsubscribePhone();
      unsubscribeActivities();
    };
  }, []);

  // Log activity
  const logActivity = async (
    activity: Omit<TelemarketingActivity, "id" | "timestamp">
  ) => {
    try {
      await addDoc(activitiesRef, {
        ...activity,
        timestamp: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
    }
  };

  // Prospect Sources CRUD
  const createProspectSource = async (
    source: Omit<ProspectSource, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const now = new Date();
      const docRef = await addDoc(prospectSourcesRef, {
        ...source,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });

      await logActivity({
        type: "prospect_source",
        action: "create",
        targetId: docRef.id,
        targetName: source.name,
        description: `Created prospect source: ${source.name}`,
        userEmail: source.createdBy,
      });

      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: "Failed to create prospect source" };
    }
  };

  const updateProspectSource = async (
    id: string,
    updates: Partial<ProspectSource>
  ) => {
    try {
      const sourceRef = doc(prospectSourcesRef, id);
      await updateDoc(sourceRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });

      const source = prospectSources.find((s) => s.id === id);
      await logActivity({
        type: "prospect_source",
        action: "update",
        targetId: id,
        targetName: source?.name || "Unknown",
        description: `Updated prospect source: ${source?.name}`,
        userEmail: updates.createdBy || "system",
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to update prospect source" };
    }
  };

  const deleteProspectSource = async (id: string) => {
    try {
      const source = prospectSources.find((s) => s.id === id);
      const sourceRef = doc(prospectSourcesRef, id);
      await deleteDoc(sourceRef);

      await logActivity({
        type: "prospect_source",
        action: "delete",
        targetId: id,
        targetName: source?.name || "Unknown",
        description: `Deleted prospect source: ${source?.name}`,
        userEmail: "current-user", // Replace with actual user
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to delete prospect source" };
    }
  };

  // Prospect Statuses CRUD
  const createProspectStatus = async (
    status: Omit<ProspectStatus, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const now = new Date();
      const docRef = await addDoc(prospectStatusesRef, {
        ...status,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });

      await logActivity({
        type: "prospect_status",
        action: "create",
        targetId: docRef.id,
        targetName: status.name,
        description: `Created prospect status: ${status.name}`,
        userEmail: status.createdBy,
      });

      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: "Failed to create prospect status" };
    }
  };

  const updateProspectStatus = async (
    id: string,
    updates: Partial<ProspectStatus>
  ) => {
    try {
      const statusRef = doc(prospectStatusesRef, id);
      await updateDoc(statusRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });

      const status = prospectStatuses.find((s) => s.id === id);
      await logActivity({
        type: "prospect_status",
        action: "update",
        targetId: id,
        targetName: status?.name || "Unknown",
        description: `Updated prospect status: ${status?.name}`,
        userEmail: updates.createdBy || "system",
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to update prospect status" };
    }
  };

  const deleteProspectStatus = async (id: string) => {
    try {
      const status = prospectStatuses.find((s) => s.id === id);
      const statusRef = doc(prospectStatusesRef, id);
      await deleteDoc(statusRef);

      await logActivity({
        type: "prospect_status",
        action: "delete",
        targetId: id,
        targetName: status?.name || "Unknown",
        description: `Deleted prospect status: ${status?.name}`,
        userEmail: "current-user", // Replace with actual user
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to delete prospect status" };
    }
  };

  // Phone Settings CRUD
  const createOrUpdatePhoneSettings = async (
    settings: Omit<PhoneSettings, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const now = new Date();

      if (phoneSettings && phoneSettings.id) {
        // Update existing
        const settingsRef = doc(phoneSettingsRef, phoneSettings.id);
        await updateDoc(settingsRef, {
          ...settings,
          updatedAt: Timestamp.fromDate(now),
        });

        await logActivity({
          type: "phone_settings",
          action: "update",
          targetId: phoneSettings.id,
          targetName: "Phone Settings",
          description: "Updated phone settings configuration",
          userEmail: settings.createdBy,
        });

        return { success: true, id: phoneSettings.id };
      } else {
        // Create new
        const docRef = await addDoc(phoneSettingsRef, {
          ...settings,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        });

        await logActivity({
          type: "phone_settings",
          action: "create",
          targetId: docRef.id,
          targetName: "Phone Settings",
          description: "Created phone settings configuration",
          userEmail: settings.createdBy,
        });

        return { success: true, id: docRef.id };
      }
    } catch (error) {
      return { success: false, error: "Failed to save phone settings" };
    }
  };

  // Utility functions
  const getActiveProspectSources = useCallback(() => {
    return prospectSources.filter((source) => source.isActive);
  }, [prospectSources]);

  const getActiveProspectStatuses = useCallback(() => {
    return prospectStatuses.filter((status) => status.isActive);
  }, [prospectStatuses]);

  const getDefaultProspectStatus = useCallback(() => {
    return prospectStatuses.find(
      (status) => status.isDefault && status.isActive
    );
  }, [prospectStatuses]);

  const getSuccessfulProspectStatuses = useCallback(() => {
    return prospectStatuses.filter(
      (status) => status.isActive && status.isSuccessful
    );
  }, [prospectStatuses]);

  const getRecentActivities = useCallback((limit: number = 20) => {
    return activities.slice(0, limit);
  }, [activities]);

  // Initialize default data
  const initializeDefaultData = async () => {
    try {
      // Default prospect sources
      const defaultSources: Omit<
        ProspectSource,
        "id" | "createdAt" | "updatedAt"
      >[] = [
        {
          name: "Website Form",
          description: "Leads from website contact form",
          isActive: true,
          color: "#3b82f6",
          priority: 1,
          createdBy: "system",
        },
        {
          name: "Social Media",
          description: "Leads from social media platforms",
          isActive: true,
          color: "#10b981",
          priority: 2,
          createdBy: "system",
        },
        {
          name: "Referral",
          description: "Referrals from existing clients",
          isActive: true,
          color: "#f59e0b",
          priority: 3,
          createdBy: "system",
        },
        {
          name: "Cold Call",
          description: "Cold calling campaigns",
          isActive: true,
          color: "#ef4444",
          priority: 4,
          createdBy: "system",
        },
      ];

      // Default prospect statuses
      const defaultStatuses: Omit<
        ProspectStatus,
        "id" | "createdAt" | "updatedAt"
      >[] = [
        {
          name: "New Lead",
          isActive: true,
          color: "#6366f1",
          priority: 1,
          isDefault: true,
          isSuccessful: false,
          nextActions: ["Initial Contact", "Qualification Call"],
          createdBy: "system",
        },
        {
          name: "Contacted",
          isActive: true,
          color: "#3b82f6",
          priority: 2,
          isDefault: false,
          isSuccessful: false,
          nextActions: ["Follow-up Call", "Send Information"],
          createdBy: "system",
        },
        {
          name: "Qualified",
          isActive: true,
          color: "#10b981",
          priority: 3,
          isDefault: false,
          isSuccessful: true,
          nextActions: ["Schedule Meeting", "Send Proposal"],
          createdBy: "system",
        },
        {
          name: "Converted",
          isActive: true,
          color: "#059669",
          priority: 4,
          isDefault: false,
          isSuccessful: true,
          nextActions: ["Onboarding", "Welcome Call"],
          createdBy: "system",
        },
        {
          name: "Not Interested",
          isActive: true,
          color: "#ef4444",
          priority: 5,
          isDefault: false,
          isSuccessful: false,
          nextActions: ["Archive", "Future Follow-up"],
          createdBy: "system",
        },
      ];

      // Default phone settings
      const defaultPhoneSettings: Omit<
        PhoneSettings,
        "id" | "createdAt" | "updatedAt"
      > = {
        callDurationMin: 2,
        callDurationMax: 30,
        dailyCallLimit: 100,
        weeklyCallLimit: 500,
        monthlyCallLimit: 2000,
        workingHours: {
          start: "09:00",
          end: "17:00",
          timezone: "Asia/Jakarta",
        },
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        autoDialEnabled: false,
        recordCallsEnabled: true,
        voicemailDetection: true,
        callBackDelay: 15,
        maxCallAttempts: 3,
        blacklistedNumbers: [],
        allowedAreaCodes: ["021", "022", "024", "031", "061"],
        callerIdSettings: {
          displayName: "Your Company",
          phoneNumber: "+6221-1234567",
          enabled: true,
        },
        // New default settings
        callDelaySeconds: 3,
        autoNextCall: true,
        defaultStatusFilter: "Baru",
        defaultSourceFilter: "Database",
        createdBy: "system",
      };

      // Create defaults if they don't exist
      if (prospectSources.length === 0) {
        for (const source of defaultSources) {
          await createProspectSource(source);
        }
      }

      if (prospectStatuses.length === 0) {
        for (const status of defaultStatuses) {
          await createProspectStatus(status);
        }
      }

      if (!phoneSettings) {
        await createOrUpdatePhoneSettings(defaultPhoneSettings);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to initialize default data" };
    }
  };

  return {
    // Data
    prospectSources,
    prospectStatuses,
    phoneSettings,
    activities,
    loading,
    error,

    // Actions
    loadData,
    createProspectSource,
    updateProspectSource,
    deleteProspectSource,
    createProspectStatus,
    updateProspectStatus,
    deleteProspectStatus,
    createOrUpdatePhoneSettings,
    initializeDefaultData,

    // Utility functions
    getActiveProspectSources,
    getActiveProspectStatuses,
    getDefaultProspectStatus,
    getSuccessfulProspectStatuses,
    getRecentActivities,
  };
}
