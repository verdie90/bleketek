"use client";

import { useState, useEffect } from "react";
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
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface FirebaseConfig {
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

export interface FirebaseCollection {
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

export interface DatabaseSettings {
  enableOfflineMode: boolean;
  cacheSizeBytes: number;
  syncOnReconnect: boolean;
  maxRetries: number;
  retryDelay: number;
  enableLogging: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
}

export function useFirebaseManagement() {
  const [configs, setConfigs] = useState<FirebaseConfig[]>([]);
  const [collections, setCollections] = useState<FirebaseCollection[]>([]);
  const [dbSettings, setDbSettings] = useState<DatabaseSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Firebase configs
      const configSnapshot = await getDocs(
        query(collection(db, "firebase_configs"), orderBy("createdAt", "desc"))
      );
      const configsData = configSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as FirebaseConfig[];
      setConfigs(configsData);

      // Load collections
      const collectionsSnapshot = await getDocs(
        query(
          collection(db, "firebase_collections"),
          orderBy("createdAt", "desc")
        )
      );
      const collectionsData = collectionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as FirebaseCollection[];
      setCollections(collectionsData);

      // Load database settings
      const settingsDoc = await getDoc(
        doc(db, "firebase_settings", "database")
      );
      if (settingsDoc.exists()) {
        setDbSettings(settingsDoc.data() as DatabaseSettings);
      }
    } catch (err) {
      console.error("Error loading Firebase data:", err);
      setError("Failed to load Firebase data");
    } finally {
      setLoading(false);
    }
  };

  // Config CRUD operations
  const createConfig = async (
    configData: Omit<FirebaseConfig, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const now = Timestamp.now();
      await addDoc(collection(db, "firebase_configs"), {
        ...configData,
        createdAt: now,
        updatedAt: now,
      });
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error creating config:", err);
      return { success: false, error: "Failed to create config" };
    }
  };

  const updateConfig = async (
    id: string,
    configData: Partial<FirebaseConfig>
  ) => {
    try {
      await updateDoc(doc(db, "firebase_configs", id), {
        ...configData,
        updatedAt: Timestamp.now(),
      });
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error updating config:", err);
      return { success: false, error: "Failed to update config" };
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      await deleteDoc(doc(db, "firebase_configs", id));
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error deleting config:", err);
      return { success: false, error: "Failed to delete config" };
    }
  };

  // Collection CRUD operations
  const createCollection = async (
    collectionData: Omit<FirebaseCollection, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const now = Timestamp.now();
      await addDoc(collection(db, "firebase_collections"), {
        ...collectionData,
        createdAt: now,
        updatedAt: now,
      });
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error creating collection:", err);
      return { success: false, error: "Failed to create collection" };
    }
  };

  const updateCollection = async (
    id: string,
    collectionData: Partial<FirebaseCollection>
  ) => {
    try {
      await updateDoc(doc(db, "firebase_collections", id), {
        ...collectionData,
        updatedAt: Timestamp.now(),
      });
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error updating collection:", err);
      return { success: false, error: "Failed to update collection" };
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      await deleteDoc(doc(db, "firebase_collections", id));
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error deleting collection:", err);
      return { success: false, error: "Failed to delete collection" };
    }
  };

  // Database settings operations
  const updateDatabaseSettings = async (settings: DatabaseSettings) => {
    try {
      await setDoc(doc(db, "firebase_settings", "database"), settings);
      setDbSettings(settings);
      return { success: true };
    } catch (err) {
      console.error("Error updating database settings:", err);
      return { success: false, error: "Failed to update database settings" };
    }
  };

  // Connection test
  const testConnection = async () => {
    try {
      await getDoc(doc(db, "test", "connection"));
      return { success: true, status: "connected" };
    } catch (err) {
      console.error("Connection test failed:", err);
      return {
        success: false,
        status: "disconnected",
        error: "Connection failed",
      };
    }
  };

  // Real-time listeners
  useEffect(() => {
    const unsubscribeConfigs = onSnapshot(
      query(collection(db, "firebase_configs"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const configsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as FirebaseConfig[];
        setConfigs(configsData);
      },
      (err) => {
        console.error("Error listening to configs:", err);
        setError("Failed to sync configs");
      }
    );

    const unsubscribeCollections = onSnapshot(
      query(
        collection(db, "firebase_collections"),
        orderBy("createdAt", "desc")
      ),
      (snapshot) => {
        const collectionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as FirebaseCollection[];
        setCollections(collectionsData);
      },
      (err) => {
        console.error("Error listening to collections:", err);
        setError("Failed to sync collections");
      }
    );

    const unsubscribeSettings = onSnapshot(
      doc(db, "firebase_settings", "database"),
      (doc) => {
        if (doc.exists()) {
          setDbSettings(doc.data() as DatabaseSettings);
        }
      },
      (err) => {
        console.error("Error listening to settings:", err);
        setError("Failed to sync settings");
      }
    );

    // Initial load
    loadData();

    return () => {
      unsubscribeConfigs();
      unsubscribeCollections();
      unsubscribeSettings();
    };
  }, []);

  return {
    // Data
    configs,
    collections,
    dbSettings,
    loading,
    error,

    // Config operations
    createConfig,
    updateConfig,
    deleteConfig,

    // Collection operations
    createCollection,
    updateCollection,
    deleteCollection,

    // Settings operations
    updateDatabaseSettings,

    // Utility
    testConnection,
    loadData,
  };
}
