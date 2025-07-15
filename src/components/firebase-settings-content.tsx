"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Database,
  Settings,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Save,
  TestTube,
  Activity,
  Server,
  Shield,
  Clock,
  HardDrive,
} from "lucide-react";

interface FirebaseConfig {
  id?: string;
  name: string;
  description: string;
  environment: "development" | "staging" | "production";
  config: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseSettings {
  enableOfflineMode: boolean;
  cacheSizeBytes: number;
  syncOnReconnect: boolean;
  maxRetries: number;
  retryDelay: number;
  enableLogging: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
}

interface Collection {
  id?: string;
  name: string;
  description: string;
  fields: Array<{
    name: string;
    type: "string" | "number" | "boolean" | "array" | "object" | "timestamp";
    required: boolean;
    defaultValue?: any;
  }>;
  indexes: Array<{
    fields: string[];
    type: "single" | "composite";
    order: "asc" | "desc";
  }>;
  rules: string;
  createdAt: Date;
  updatedAt: Date;
}

const defaultDatabaseSettings: DatabaseSettings = {
  enableOfflineMode: true,
  cacheSizeBytes: 40 * 1024 * 1024, // 40MB
  syncOnReconnect: true,
  maxRetries: 3,
  retryDelay: 1000,
  enableLogging: false,
  logLevel: "info",
};

export default function FirebaseSettingsContent() {
  const [configs, setConfigs] = useState<FirebaseConfig[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [dbSettings, setDbSettings] = useState<DatabaseSettings>(
    defaultDatabaseSettings
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingConfig, setEditingConfig] = useState<FirebaseConfig | null>(
    null
  );
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null
  );
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("connecting");

  useEffect(() => {
    loadData();
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus("connecting");
      await getDoc(doc(db, "test", "connection"));
      setConnectionStatus("connected");
    } catch (error) {
      setConnectionStatus("disconnected");
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load Firebase configs
      const configSnapshot = await getDocs(collection(db, "firebase_configs"));
      const configsData = configSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as FirebaseConfig[];
      setConfigs(configsData);

      // Load collections
      const collectionsSnapshot = await getDocs(
        collection(db, "firebase_collections")
      );
      const collectionsData = collectionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Collection[];
      setCollections(collectionsData);

      // Load database settings
      const settingsDoc = await getDoc(
        doc(db, "firebase_settings", "database")
      );
      if (settingsDoc.exists()) {
        setDbSettings(settingsDoc.data() as DatabaseSettings);
      } else {
        await setDoc(
          doc(db, "firebase_settings", "database"),
          defaultDatabaseSettings
        );
      }
    } catch (error) {
      toast.error("Gagal memuat data Firebase");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (
    config: Omit<FirebaseConfig, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      setSaving(true);
      const now = new Date();

      if (editingConfig?.id) {
        await updateDoc(doc(db, "firebase_configs", editingConfig.id), {
          ...config,
          updatedAt: now,
        });
        toast.success("Konfigurasi berhasil diperbarui");
      } else {
        await addDoc(collection(db, "firebase_configs"), {
          ...config,
          createdAt: now,
          updatedAt: now,
        });
        toast.success("Konfigurasi berhasil ditambahkan");
      }

      loadData();
      setIsConfigDialogOpen(false);
      setEditingConfig(null);
    } catch (error) {
      toast.error("Gagal menyimpan konfigurasi");
    } finally {
      setSaving(false);
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      await deleteDoc(doc(db, "firebase_configs", id));
      toast.success("Konfigurasi berhasil dihapus");
      loadData();
    } catch (error) {
      toast.error("Gagal menghapus konfigurasi");
    }
  };

  const saveCollection = async (
    collectionData: Omit<Collection, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      setSaving(true);
      const now = new Date();

      if (editingCollection?.id) {
        await updateDoc(doc(db, "firebase_collections", editingCollection.id), {
          ...collectionData,
          updatedAt: now,
        });
        toast.success("Collection berhasil diperbarui");
      } else {
        await addDoc(collection(db, "firebase_collections"), {
          ...collectionData,
          createdAt: now,
          updatedAt: now,
        });
        toast.success("Collection berhasil ditambahkan");
      }

      loadData();
      setIsCollectionDialogOpen(false);
      setEditingCollection(null);
    } catch (error) {
      toast.error("Gagal menyimpan collection");
    } finally {
      setSaving(false);
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      await deleteDoc(doc(db, "firebase_collections", id));
      toast.success("Collection berhasil dihapus");
      loadData();
    } catch (error) {
      toast.error("Gagal menghapus collection");
    }
  };

  const saveDatabaseSettings = async () => {
    try {
      setSaving(true);
      await setDoc(doc(db, "firebase_settings", "database"), dbSettings);
      toast.success("Pengaturan database berhasil disimpan");
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan database");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: typeof connectionStatus) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "disconnected":
        return "bg-red-500";
      case "connecting":
        return "bg-yellow-500";
    }
  };

  const getStatusText = (status: typeof connectionStatus) => {
    switch (status) {
      case "connected":
        return "Terhubung";
      case "disconnected":
        return "Terputus";
      case "connecting":
        return "Menghubungkan...";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Memuat pengaturan Firebase...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Pengaturan Firebase
          </h2>
          <p className="text-muted-foreground">
            Kelola konfigurasi Firebase dan operasi CRUD
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${getStatusColor(
                connectionStatus
              )}`}
            />
            <span className="text-sm">{getStatusText(connectionStatus)}</span>
          </div>
          <Button onClick={testConnection} variant="outline" size="sm">
            <TestTube className="mr-2 h-4 w-4" />
            Test Koneksi
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configs">
            <Settings className="mr-2 h-4 w-4" />
            Konfigurasi
          </TabsTrigger>
          <TabsTrigger value="collections">
            <Database className="mr-2 h-4 w-4" />
            Collections
          </TabsTrigger>
          <TabsTrigger value="database">
            <Server className="mr-2 h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="mr-2 h-4 w-4" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Konfigurasi Firebase</CardTitle>
                  <CardDescription>
                    Kelola konfigurasi Firebase untuk berbagai environment
                  </CardDescription>
                </div>
                <Dialog
                  open={isConfigDialogOpen}
                  onOpenChange={setIsConfigDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingConfig(null)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Konfigurasi
                    </Button>
                  </DialogTrigger>
                  <ConfigDialog
                    config={editingConfig}
                    onSave={saveConfig}
                    saving={saving}
                  />
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Project ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">
                        {config.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            config.environment === "production"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {config.environment}
                        </Badge>
                      </TableCell>
                      <TableCell>{config.config.projectId}</TableCell>
                      <TableCell>
                        <Badge
                          variant={config.isActive ? "default" : "secondary"}
                        >
                          {config.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingConfig(config);
                              setIsConfigDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Hapus Konfigurasi
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus konfigurasi
                                  "{config.name}"? Tindakan ini tidak dapat
                                  dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    config.id && deleteConfig(config.id)
                                  }
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {configs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada konfigurasi Firebase. Klik "Tambah Konfigurasi"
                  untuk memulai.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Collections Management</CardTitle>
                  <CardDescription>
                    Kelola struktur dan konfigurasi collections Firestore
                  </CardDescription>
                </div>
                <Dialog
                  open={isCollectionDialogOpen}
                  onOpenChange={setIsCollectionDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingCollection(null)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Collection
                    </Button>
                  </DialogTrigger>
                  <CollectionDialog
                    collection={editingCollection}
                    onSave={saveCollection}
                    saving={saving}
                  />
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Indexes</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.map((coll) => (
                    <TableRow key={coll.id}>
                      <TableCell className="font-medium">{coll.name}</TableCell>
                      <TableCell>{coll.description}</TableCell>
                      <TableCell>{coll.fields.length} fields</TableCell>
                      <TableCell>{coll.indexes.length} indexes</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCollection(coll);
                              setIsCollectionDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Hapus Collection
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus collection "
                                  {coll.name}"? Tindakan ini tidak dapat
                                  dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    coll.id && deleteCollection(coll.id)
                                  }
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {collections.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada collection. Klik "Tambah Collection" untuk memulai.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pengaturan Database</CardTitle>
                  <CardDescription>
                    Konfigurasi performance dan behavior database Firestore
                  </CardDescription>
                </div>
                <Button onClick={saveDatabaseSettings} disabled={saving}>
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
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mode Offline</Label>
                      <p className="text-sm text-muted-foreground">
                        Aktifkan caching offline untuk performa yang lebih baik
                      </p>
                    </div>
                    <Switch
                      checked={dbSettings.enableOfflineMode}
                      onCheckedChange={(checked) =>
                        setDbSettings((prev) => ({
                          ...prev,
                          enableOfflineMode: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cacheSize">Ukuran Cache (Bytes)</Label>
                    <Input
                      id="cacheSize"
                      type="number"
                      value={dbSettings.cacheSizeBytes}
                      onChange={(e) =>
                        setDbSettings((prev) => ({
                          ...prev,
                          cacheSizeBytes: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Sync on Reconnect</Label>
                      <p className="text-sm text-muted-foreground">
                        Sinkronisasi otomatis saat koneksi kembali
                      </p>
                    </div>
                    <Switch
                      checked={dbSettings.syncOnReconnect}
                      onCheckedChange={(checked) =>
                        setDbSettings((prev) => ({
                          ...prev,
                          syncOnReconnect: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxRetries">Maksimal Retry</Label>
                    <Input
                      id="maxRetries"
                      type="number"
                      value={dbSettings.maxRetries}
                      onChange={(e) =>
                        setDbSettings((prev) => ({
                          ...prev,
                          maxRetries: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retryDelay">Delay Retry (ms)</Label>
                    <Input
                      id="retryDelay"
                      type="number"
                      value={dbSettings.retryDelay}
                      onChange={(e) =>
                        setDbSettings((prev) => ({
                          ...prev,
                          retryDelay: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Logging</Label>
                      <p className="text-sm text-muted-foreground">
                        Aktifkan logging untuk debugging
                      </p>
                    </div>
                    <Switch
                      checked={dbSettings.enableLogging}
                      onCheckedChange={(checked) =>
                        setDbSettings((prev) => ({
                          ...prev,
                          enableLogging: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logLevel">Log Level</Label>
                    <Select
                      value={dbSettings.logLevel}
                      onValueChange={(value) =>
                        setDbSettings((prev) => ({
                          ...prev,
                          logLevel: value as
                            | "debug"
                            | "info"
                            | "warn"
                            | "error",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debug">Debug</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warn">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Connection Status
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getStatusText(connectionStatus)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Firebase Firestore
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Configs
                </CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{configs.length}</div>
                <p className="text-xs text-muted-foreground">
                  Firebase configurations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Collections
                </CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{collections.length}</div>
                <p className="text-xs text-muted-foreground">
                  Firestore collections
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Log aktivitas terbaru pada Firebase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Database connection established
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
                {configs.slice(0, 3).map((config) => (
                  <div key={config.id} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Config "{config.name}" updated
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {config.updatedAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Dialog components
function ConfigDialog({
  config,
  onSave,
  saving,
}: {
  config: FirebaseConfig | null;
  onSave: (
    config: Omit<FirebaseConfig, "id" | "createdAt" | "updatedAt">
  ) => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState<
    Omit<FirebaseConfig, "id" | "createdAt" | "updatedAt">
  >({
    name: "",
    description: "",
    environment: "development",
    config: {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
      measurementId: "",
    },
    isActive: false,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name,
        description: config.description,
        environment: config.environment,
        config: config.config,
        isActive: config.isActive,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        environment: "development",
        config: {
          apiKey: "",
          authDomain: "",
          projectId: "",
          storageBucket: "",
          messagingSenderId: "",
          appId: "",
          measurementId: "",
        },
        isActive: false,
      });
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {config ? "Edit Konfigurasi" : "Tambah Konfigurasi"}
          </DialogTitle>
          <DialogDescription>
            Masukkan detail konfigurasi Firebase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Select
                value={formData.environment}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    environment: value as
                      | "development"
                      | "staging"
                      | "production",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Konfigurasi Firebase</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.config.apiKey}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: { ...prev.config, apiKey: e.target.value },
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authDomain">Auth Domain</Label>
                <Input
                  id="authDomain"
                  value={formData.config.authDomain}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: { ...prev.config, authDomain: e.target.value },
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectId">Project ID</Label>
                <Input
                  id="projectId"
                  value={formData.config.projectId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: { ...prev.config, projectId: e.target.value },
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storageBucket">Storage Bucket</Label>
                <Input
                  id="storageBucket"
                  value={formData.config.storageBucket}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: { ...prev.config, storageBucket: e.target.value },
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="messagingSenderId">Messaging Sender ID</Label>
                <Input
                  id="messagingSenderId"
                  value={formData.config.messagingSenderId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        messagingSenderId: e.target.value,
                      },
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appId">App ID</Label>
                <Input
                  id="appId"
                  value={formData.config.appId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: { ...prev.config, appId: e.target.value },
                    }))
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="measurementId">Measurement ID (Optional)</Label>
              <Input
                id="measurementId"
                value={formData.config.measurementId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    config: { ...prev.config, measurementId: e.target.value },
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
            <Label htmlFor="isActive">Aktifkan konfigurasi ini</Label>
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function CollectionDialog({
  collection,
  onSave,
  saving,
}: {
  collection: Collection | null;
  onSave: (
    collectionData: Omit<Collection, "id" | "createdAt" | "updatedAt">
  ) => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState<
    Omit<Collection, "id" | "createdAt" | "updatedAt">
  >({
    name: "",
    description: "",
    fields: [],
    indexes: [],
    rules: "",
  });

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        description: collection.description,
        fields: collection.fields,
        indexes: collection.indexes,
        rules: collection.rules,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        fields: [],
        indexes: [],
        rules: "",
      });
    }
  }, [collection]);

  const addField = () => {
    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, { name: "", type: "string", required: false }],
    }));
  };

  const removeField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const updateField = (
    index: number,
    field: Partial<(typeof formData.fields)[0]>
  ) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => (i === index ? { ...f, ...field } : f)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {collection ? "Edit Collection" : "Tambah Collection"}
          </DialogTitle>
          <DialogDescription>
            Konfigurasi struktur dan properties collection Firestore
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="collectionName">Nama Collection</Label>
              <Input
                id="collectionName"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collectionDescription">Deskripsi</Label>
              <Input
                id="collectionDescription"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Fields</h4>
              <Button type="button" onClick={addField} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Field
              </Button>
            </div>

            {formData.fields.map((field, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <Label>Nama Field</Label>
                  <Input
                    value={field.name}
                    onChange={(e) =>
                      updateField(index, { name: e.target.value })
                    }
                    placeholder="field_name"
                  />
                </div>
                <div className="col-span-3">
                  <Label>Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value) =>
                      updateField(index, { type: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="array">Array</SelectItem>
                      <SelectItem value="object">Object</SelectItem>
                      <SelectItem value="timestamp">Timestamp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label>Default Value</Label>
                  <Input
                    value={field.defaultValue || ""}
                    onChange={(e) =>
                      updateField(index, { defaultValue: e.target.value })
                    }
                    placeholder="Default value"
                  />
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Switch
                    checked={field.required}
                    onCheckedChange={(checked) =>
                      updateField(index, { required: checked })
                    }
                  />
                  <Label className="text-sm">Required</Label>
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeField(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">Security Rules</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, rules: e.target.value }))
              }
              placeholder="allow read, write: if request.auth != null;"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
