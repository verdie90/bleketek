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
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

export interface TelemarketingScript {
  id?: string;
  title: string;
  description?: string;
  content: string; // HTML content from rich editor
  tags: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp;
  lastUpdated: Timestamp;
  lastUsed?: Timestamp;
  usageCount: number;
}

export interface ScriptsFilter {
  isActive?: boolean;
  tags?: string[];
  search?: string;
}

export function useTelemarketingScripts() {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<TelemarketingScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scriptsRef = collection(db, "telemarketing_scripts");

  // Real-time listener for scripts
  useEffect(() => {
    if (!user?.id) {
      setScripts([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query(scriptsRef, orderBy("lastUpdated", "desc")),
      (snapshot) => {
        const scriptsData: TelemarketingScript[] = [];
        snapshot.forEach((doc) => {
          scriptsData.push({
            id: doc.id,
            ...doc.data(),
          } as TelemarketingScript);
        });
        setScripts(scriptsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching scripts:", err);
        setError("Failed to fetch scripts");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  // Add new script
  const addScript = useCallback(
    async (
      scriptData: Omit<
        TelemarketingScript,
        "id" | "createdAt" | "lastUpdated" | "createdBy" | "usageCount"
      >
    ) => {
      if (!user?.id) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        setLoading(true);

        const newScript = {
          ...scriptData,
          createdBy: user.id,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          usageCount: 0,
        };

        await addDoc(scriptsRef, newScript);

        setLoading(false);
        return { success: true };
      } catch (err) {
        console.error("Error adding script:", err);
        setLoading(false);
        return { success: false, error: "Failed to add script" };
      }
    },
    [user?.id, scriptsRef]
  );

  // Update script
  const updateScript = useCallback(
    async (scriptId: string, updateData: Partial<TelemarketingScript>) => {
      if (!user?.id || !scriptId) {
        return { success: false, error: "Invalid parameters" };
      }

      try {
        setLoading(true);

        const scriptRef = doc(db, "telemarketing_scripts", scriptId);

        const dataToUpdate = {
          ...updateData,
          lastUpdated: serverTimestamp(),
        };

        await updateDoc(scriptRef, dataToUpdate);

        setLoading(false);
        return { success: true };
      } catch (err) {
        console.error("Error updating script:", err);
        setLoading(false);
        return { success: false, error: "Failed to update script" };
      }
    },
    [user?.id]
  );

  // Delete script
  const deleteScript = useCallback(
    async (scriptId: string) => {
      if (!user?.id || !scriptId) {
        return { success: false, error: "Invalid parameters" };
      }

      try {
        setLoading(true);

        const scriptRef = doc(db, "telemarketing_scripts", scriptId);
        await deleteDoc(scriptRef);

        setLoading(false);
        return { success: true };
      } catch (err) {
        console.error("Error deleting script:", err);
        setLoading(false);
        return { success: false, error: "Failed to delete script" };
      }
    },
    [user?.id]
  );

  // Increment usage count
  const incrementUsage = useCallback(
    async (scriptId: string) => {
      if (!user?.id || !scriptId) {
        return { success: false, error: "Invalid parameters" };
      }

      try {
        const script = scripts.find((s) => s.id === scriptId);
        if (!script) return { success: false, error: "Script not found" };

        const scriptRef = doc(db, "telemarketing_scripts", scriptId);

        await updateDoc(scriptRef, {
          usageCount: (script.usageCount || 0) + 1,
          lastUsed: serverTimestamp(),
        });

        return { success: true };
      } catch (err) {
        console.error("Error incrementing usage:", err);
        return { success: false, error: "Failed to update usage" };
      }
    },
    [user?.id, scripts]
  );

  // Filter scripts
  const filterScripts = useCallback(
    (filter: ScriptsFilter) => {
      return scripts.filter((script) => {
        // Active status filter
        if (
          filter.isActive !== undefined &&
          script.isActive !== filter.isActive
        ) {
          return false;
        }

        // Tags filter
        if (filter.tags && filter.tags.length > 0) {
          const hasMatchingTag = filter.tags.some((tag) =>
            script.tags.some((scriptTag) =>
              scriptTag.toLowerCase().includes(tag.toLowerCase())
            )
          );
          if (!hasMatchingTag) return false;
        }

        // Search filter
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          const matchesTitle = script.title.toLowerCase().includes(searchLower);
          const matchesDescription = script.description
            ?.toLowerCase()
            .includes(searchLower);
          const matchesContent = script.content
            .toLowerCase()
            .includes(searchLower);
          const matchesTags = script.tags.some((tag) =>
            tag.toLowerCase().includes(searchLower)
          );

          if (
            !matchesTitle &&
            !matchesDescription &&
            !matchesContent &&
            !matchesTags
          ) {
            return false;
          }
        }

        return true;
      });
    },
    [scripts]
  );

  // Get all tags
  const getAllTags = useCallback(() => {
    const tags = new Set<string>();
    scripts.forEach((script) => {
      script.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [scripts]);

  return {
    scripts,
    loading,
    error,
    addScript,
    updateScript,
    deleteScript,
    incrementUsage,
    filterScripts,
    getAllTags,
  };
}
