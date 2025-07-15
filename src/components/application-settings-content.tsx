"use client";

import React, { useState } from "react";
import { useAppSettings } from "@/hooks/use-app-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Save,
  RefreshCw,
  Database,
  Bell,
  Palette,
  Shield,
  RotateCcw,
} from "lucide-react";

interface AppSettings {
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

const defaultSettings: AppSettings = {
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

export default function ApplicationSettingsContent() {
  const { settings, loading, error, updateSetting, resetToDefaults } =
    useAppSettings();
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  // Update local settings when hook settings change
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateSetting(
      "general",
      "appName",
      localSettings.general.appName
    );
    if (success) {
      toast.success("Pengaturan berhasil disimpan");
    } else {
      toast.error("Gagal menyimpan pengaturan");
    }
    setSaving(false);
  };

  const handleReset = async () => {
    setSaving(true);
    const success = await resetToDefaults();
    if (success) {
      toast.success("Pengaturan berhasil direset ke default");
    } else {
      toast.error("Gagal mereset pengaturan");
    }
    setSaving(false);
  };

  const updateLocalSetting = (
    section: keyof AppSettings,
    field: string,
    value: any
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const saveSpecificSetting = async (
    section: keyof AppSettings,
    field: string,
    value: any
  ) => {
    const success = await updateSetting(section, field, value);
    if (success) {
      toast.success("Pengaturan berhasil disimpan");
    } else {
      toast.error("Gagal menyimpan pengaturan");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Memuat pengaturan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Pengaturan Aplikasi
          </h2>
          <p className="text-muted-foreground">
            Kelola konfigurasi dan preferensi aplikasi
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Umum</TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifikasi
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Tampilan
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Keamanan
          </TabsTrigger>
          <TabsTrigger value="firebase">
            <Database className="mr-2 h-4 w-4" />
            Firebase
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Umum</CardTitle>
              <CardDescription>
                Konfigurasi dasar aplikasi dan regional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Nama Aplikasi</Label>
                  <Input
                    id="appName"
                    value={localSettings.general.appName}
                    onChange={(e) =>
                      updateLocalSetting("general", "appName", e.target.value)
                    }
                    onBlur={(e) =>
                      saveSpecificSetting("general", "appName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appVersion">Versi Aplikasi</Label>
                  <Input
                    id="appVersion"
                    value={localSettings.general.appVersion}
                    onChange={(e) =>
                      updateLocalSetting(
                        "general",
                        "appVersion",
                        e.target.value
                      )
                    }
                    onBlur={(e) =>
                      saveSpecificSetting(
                        "general",
                        "appVersion",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appDescription">Deskripsi Aplikasi</Label>
                <Textarea
                  id="appDescription"
                  value={localSettings.general.appDescription}
                  onChange={(e) =>
                    updateLocalSetting(
                      "general",
                      "appDescription",
                      e.target.value
                    )
                  }
                  onBlur={(e) =>
                    saveSpecificSetting(
                      "general",
                      "appDescription",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Waktu</Label>
                  <Select
                    value={localSettings.general.timezone}
                    onValueChange={(value) => {
                      updateLocalSetting("general", "timezone", value);
                      saveSpecificSetting("general", "timezone", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Jakarta">
                        WIB (Jakarta)
                      </SelectItem>
                      <SelectItem value="Asia/Makassar">
                        WITA (Makassar)
                      </SelectItem>
                      <SelectItem value="Asia/Jayapura">
                        WIT (Jayapura)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Bahasa</Label>
                  <Select
                    value={localSettings.general.language}
                    onValueChange={(value) => {
                      updateLocalSetting("general", "language", value);
                      saveSpecificSetting("general", "language", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id-ID">Bahasa Indonesia</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Format Tanggal</Label>
                  <Select
                    value={localSettings.general.dateFormat}
                    onValueChange={(value) => {
                      updateLocalSetting("general", "dateFormat", value);
                      saveSpecificSetting("general", "dateFormat", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
              <CardDescription>
                Kelola preferensi notifikasi aplikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifikasi Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Terima notifikasi melalui email
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.notifications.emailNotifications}
                    onCheckedChange={(checked) => {
                      updateLocalSetting(
                        "notifications",
                        "emailNotifications",
                        checked
                      );
                      saveSpecificSetting(
                        "notifications",
                        "emailNotifications",
                        checked
                      );
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifikasi Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Terima notifikasi push di browser
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.notifications.pushNotifications}
                    onCheckedChange={(checked) => {
                      updateLocalSetting(
                        "notifications",
                        "pushNotifications",
                        checked
                      );
                      saveSpecificSetting(
                        "notifications",
                        "pushNotifications",
                        checked
                      );
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifikasi SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Terima notifikasi melalui SMS
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.notifications.smsNotifications}
                    onCheckedChange={(checked) => {
                      updateLocalSetting(
                        "notifications",
                        "smsNotifications",
                        checked
                      );
                      saveSpecificSetting(
                        "notifications",
                        "smsNotifications",
                        checked
                      );
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Suara Notifikasi</Label>
                    <p className="text-sm text-muted-foreground">
                      Putar suara saat menerima notifikasi
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.notifications.notificationSound}
                    onCheckedChange={(checked) => {
                      updateLocalSetting(
                        "notifications",
                        "notificationSound",
                        checked
                      );
                      saveSpecificSetting(
                        "notifications",
                        "notificationSound",
                        checked
                      );
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Tampilan</CardTitle>
              <CardDescription>
                Sesuaikan tampilan dan tema aplikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema</Label>
                  <Select
                    value={localSettings.appearance.theme}
                    onValueChange={(value) => {
                      updateLocalSetting(
                        "appearance",
                        "theme",
                        value as "light" | "dark" | "system"
                      );
                      saveSpecificSetting("appearance", "theme", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Terang</SelectItem>
                      <SelectItem value="dark">Gelap</SelectItem>
                      <SelectItem value="system">Mengikuti Sistem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Warna Utama</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={localSettings.appearance.primaryColor}
                    onChange={(e) =>
                      updateLocalSetting(
                        "appearance",
                        "primaryColor",
                        e.target.value
                      )
                    }
                    onBlur={(e) =>
                      saveSpecificSetting(
                        "appearance",
                        "primaryColor",
                        e.target.value
                      )
                    }
                    className="w-20 h-10"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sidebar Diperkecil</Label>
                    <p className="text-sm text-muted-foreground">
                      Tampilkan sidebar dalam mode ikon
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.appearance.sidebarCollapsed}
                    onCheckedChange={(checked) => {
                      updateLocalSetting(
                        "appearance",
                        "sidebarCollapsed",
                        checked
                      );
                      saveSpecificSetting(
                        "appearance",
                        "sidebarCollapsed",
                        checked
                      );
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pesan Selamat Datang</Label>
                    <p className="text-sm text-muted-foreground">
                      Tampilkan pesan selamat datang di dashboard
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.appearance.showWelcomeMessage}
                    onCheckedChange={(checked) => {
                      updateLocalSetting(
                        "appearance",
                        "showWelcomeMessage",
                        checked
                      );
                      saveSpecificSetting(
                        "appearance",
                        "showWelcomeMessage",
                        checked
                      );
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Keamanan</CardTitle>
              <CardDescription>
                Kelola pengaturan keamanan dan autentikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout Sesi (menit)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={localSettings.security.sessionTimeout}
                    onChange={(e) =>
                      updateLocalSetting(
                        "security",
                        "sessionTimeout",
                        parseInt(e.target.value)
                      )
                    }
                    onBlur={(e) =>
                      saveSpecificSetting(
                        "security",
                        "sessionTimeout",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry">
                    Kedaluwarsa Password (hari)
                  </Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={localSettings.security.passwordExpiry}
                    onChange={(e) =>
                      updateLocalSetting(
                        "security",
                        "passwordExpiry",
                        parseInt(e.target.value)
                      )
                    }
                    onBlur={(e) =>
                      saveSpecificSetting(
                        "security",
                        "passwordExpiry",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">
                    Maksimal Percobaan Login
                  </Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={localSettings.security.maxLoginAttempts}
                    onChange={(e) =>
                      updateLocalSetting(
                        "security",
                        "maxLoginAttempts",
                        parseInt(e.target.value)
                      )
                    }
                    onBlur={(e) =>
                      saveSpecificSetting(
                        "security",
                        "maxLoginAttempts",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autentikasi Dua Faktor</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan autentikasi dua faktor untuk keamanan tambahan
                  </p>
                </div>
                <Switch
                  checked={localSettings.security.twoFactorAuth}
                  onCheckedChange={(checked) => {
                    updateLocalSetting("security", "twoFactorAuth", checked);
                    saveSpecificSetting("security", "twoFactorAuth", checked);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="firebase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Firebase</CardTitle>
              <CardDescription>
                Kelola konfigurasi Firebase dan sinkronisasi data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mode Offline</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan mode offline untuk bekerja tanpa koneksi internet
                  </p>
                </div>
                <Switch
                  checked={localSettings.firebase.enableOfflineMode}
                  onCheckedChange={(checked) => {
                    updateLocalSetting(
                      "firebase",
                      "enableOfflineMode",
                      checked
                    );
                    saveSpecificSetting(
                      "firebase",
                      "enableOfflineMode",
                      checked
                    );
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cacheSize">Ukuran Cache (MB)</Label>
                  <Input
                    id="cacheSize"
                    type="number"
                    value={localSettings.firebase.cacheSize}
                    onChange={(e) =>
                      updateLocalSetting(
                        "firebase",
                        "cacheSize",
                        parseInt(e.target.value)
                      )
                    }
                    onBlur={(e) =>
                      saveSpecificSetting(
                        "firebase",
                        "cacheSize",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="syncInterval">
                    Interval Sinkronisasi (menit)
                  </Label>
                  <Input
                    id="syncInterval"
                    type="number"
                    value={localSettings.firebase.syncInterval}
                    onChange={(e) =>
                      updateLocalSetting(
                        "firebase",
                        "syncInterval",
                        parseInt(e.target.value)
                      )
                    }
                    onBlur={(e) =>
                      saveSpecificSetting(
                        "firebase",
                        "syncInterval",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
