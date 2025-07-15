"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAppSettings, AppSettings } from "@/hooks/use-app-settings";

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  updateSetting: (
    section: keyof AppSettings,
    field: string,
    value: any
  ) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settingsHook = useAppSettings();

  return (
    <SettingsContext.Provider value={settingsHook}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
