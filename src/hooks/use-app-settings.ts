"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AppSettings {
  general: {
    appName: string;
    appDescription: string;
    appVersion: string;
    timezone: string;
    language: string;
    dateFormat: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    notificationSound: boolean;
  };
  appearance: {
    theme: "light" | "dark" | "system";
    primaryColor: string;
    sidebarCollapsed: boolean;
    showWelcomeMessage: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordExpiry: number;
    maxLoginAttempts: number;
    twoFactorAuth: boolean;
  };
  firebase: {
    enableOfflineMode: boolean;
    cacheSize: number;
    syncInterval: number;
  };
}

export const defaultSettings: AppSettings = {
  general: {
    appName: "BlekeTek",
    appDescription: "Professional Business Management System",
    appVersion: "1.0.0",
    timezone: "Asia/Jakarta",
    language: "id-ID",
    dateFormat: "DD/MM/YYYY",
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    notificationSound: true,
  },
  appearance: {
    theme: "system",
    primaryColor: "#0ea5e9",
    sidebarCollapsed: false,
    showWelcomeMessage: true,
  },
  security: {
    sessionTimeout: 30,
    passwordExpiry: 90,
    maxLoginAttempts: 3,
    twoFactorAuth: false,
  },
  firebase: {
    enableOfflineMode: true,
    cacheSize: 40,
    syncInterval: 5,
  },
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const settingsRef = doc(db, "application", "settings");

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      settingsRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as AppSettings;
          setSettings({ ...defaultSettings, ...data });
        } else {
          // Create default settings if they don't exist
          setDoc(settingsRef, defaultSettings);
          setSettings(defaultSettings);
        }
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError("Failed to load settings");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const settingsRef = doc(db, "application", "settings");
      const updatedSettings = { ...settings, ...newSettings };
      await updateDoc(settingsRef, { ...updatedSettings });
      return true;
    } catch (error) {
      setError("Failed to update settings");
      return false;
    }
  };

  const updateSetting = async (
    section: keyof AppSettings,
    field: string,
    value: any
  ) => {
    try {
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          [field]: value,
        },
      };

      const settingsRef = doc(db, "application", "settings");
      await updateDoc(settingsRef, { ...newSettings });
      return true;
    } catch (error) {
      setError("Failed to update setting");
      return false;
    }
  };

  const resetToDefaults = async () => {
    try {
      const settingsRef = doc(db, "application", "settings");
      await setDoc(settingsRef, defaultSettings);
      return true;
    } catch (error) {
      setError("Failed to reset settings");
      return false;
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    updateSetting,
    resetToDefaults,
  };
}
