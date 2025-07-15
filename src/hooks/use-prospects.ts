"use client";

import { useState, useEffect } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useTelemarketingSettings } from "./use-telemarketing-settings";
import { useUserManagement } from "./use-user-management-db";

export interface Prospect {
  id?: string;
  name: string;
  phone: string;
  phoneNumber: string; // For backward compatibility
  status: string; // Dynamic status from database
  source: string; // Dynamic source from database (was: "Database")
  assignedTo?: string;
  tags: string[];
  notes?: string;
  createdAt: Timestamp;
  lastUpdated: Timestamp;
  createdBy?: string;
  lastContactDate?: Timestamp;
  nextFollowUpDate?: Timestamp;
}

export interface ProspectsFilter {
  status?: string[];
  source?: string[];
  assignedTo?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}

export const useProspects = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get data from related hooks
  const {
    prospectSources,
    prospectStatuses,
    getActiveProspectSources,
    getActiveProspectStatuses,
  } = useTelemarketingSettings();
  const { users } = useUserManagement();

  // Helper functions to get options from database
  const getSourceOptions = () => {
    return getActiveProspectSources().map((source) => ({
      value: source.id!,
      label: source.name,
      color: source.color,
    }));
  };

  const getStatusOptions = () => {
    return getActiveProspectStatuses().map((status) => ({
      value: status.id!,
      label: status.name,
      color: status.color,
    }));
  };

  const getAssignedToOptions = () => {
    return users
      .filter((user) => user.isActive)
      .map((user) => ({
        value: user.id!,
        label: user.displayName,
        email: user.email,
        role: user.role,
      }));
  };

  // Load prospects from Firestore
  const loadProspects = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "prospects"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const prospectsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Prospect[];
      setProspects(prospectsData);
    } catch (err: any) {
      console.error("Error loading prospects:", err);
      setError(err.message || "Failed to load prospects");
    } finally {
      setLoading(false);
    }
  };

  // Real-time listener for prospects
  useEffect(() => {
    const q = query(collection(db, "prospects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const prospectsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Prospect[];
        setProspects(prospectsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error in prospects listener:", err);
        setError(err.message || "Failed to load prospects");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Add a single prospect
  const addProspect = async (
    prospectData: Omit<Prospect, "id" | "createdAt" | "lastUpdated">
  ) => {
    try {
      const now = Timestamp.now();
      const newProspect = {
        ...prospectData,
        createdAt: now,
        lastUpdated: now,
      };

      await addDoc(collection(db, "prospects"), newProspect);
      return { success: true };
    } catch (err: any) {
      console.error("Error adding prospect:", err);
      return { success: false, error: err.message || "Failed to add prospect" };
    }
  };

  // Update a prospect
  const updateProspect = async (id: string, updateData: Partial<Prospect>) => {
    try {
      console.log("🔍 updateProspect called with:", {
        prospectId: id,
        updateData,
        timestamp: new Date().toISOString()
      });
      
      const prospectRef = doc(db, "prospects", id);
      const finalUpdateData = {
        ...updateData,
        lastUpdated: Timestamp.now(),
      };
      
      console.log("🔍 Final update data being sent to Firestore:", finalUpdateData);
      
      await updateDoc(prospectRef, finalUpdateData);
      
      console.log("✅ Prospect updated successfully in Firestore");
      
      return { success: true };
    } catch (err: any) {
      console.error("❌ Error updating prospect:", err);
      return {
        success: false,
        error: err.message || "Failed to update prospect",
      };
    }
  };

  // Delete a prospect
  const deleteProspect = async (id: string) => {
    try {
      await deleteDoc(doc(db, "prospects", id));
      return { success: true };
    } catch (err: any) {
      console.error("Error deleting prospect:", err);
      return {
        success: false,
        error: err.message || "Failed to delete prospect",
      };
    }
  };

  // Bulk operations
  const bulkUpdateProspects = async (
    ids: string[],
    updateData: Partial<Prospect>
  ) => {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();

      ids.forEach((id) => {
        const prospectRef = doc(db, "prospects", id);
        batch.update(prospectRef, {
          ...updateData,
          lastUpdated: now,
        });
      });

      await batch.commit();
      return { success: true };
    } catch (err: any) {
      console.error("Error bulk updating prospects:", err);
      return {
        success: false,
        error: err.message || "Failed to bulk update prospects",
      };
    }
  };

  const bulkDeleteProspects = async (ids: string[]) => {
    try {
      const batch = writeBatch(db);

      ids.forEach((id) => {
        const prospectRef = doc(db, "prospects", id);
        batch.delete(prospectRef);
      });

      await batch.commit();
      return { success: true };
    } catch (err: any) {
      console.error("Error bulk deleting prospects:", err);
      return {
        success: false,
        error: err.message || "Failed to bulk delete prospects",
      };
    }
  };

  // Import prospects from Excel data
  const importProspects = async (
    importData: Array<{ name: string; phoneNumber: string }>,
    options: {
      source: string; // This should be the name, not ID
      status: string; // This should be the name, not ID
      assignedTo?: string;
      tags: string[];
      skipDuplicates: boolean;
    }
  ) => {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();
      let imported = 0;
      let skipped = 0;

      // Check for duplicates if needed
      let existingNumbers: string[] = [];
      if (options.skipDuplicates) {
        const existingProspects = await getDocs(collection(db, "prospects"));
        existingNumbers = existingProspects.docs.map(
          (doc) => doc.data().phoneNumber || doc.data().phone
        );
      }

      for (const data of importData) {
        // Skip if duplicate and option is enabled
        if (
          options.skipDuplicates &&
          existingNumbers.includes(data.phoneNumber)
        ) {
          skipped++;
          continue;
        }

        const prospectRef = doc(collection(db, "prospects"));
        const prospectData = {
          name: data.name,
          phone: data.phoneNumber,
          phoneNumber: data.phoneNumber, // For backward compatibility
          source: options.source, // Now storing name directly
          status: options.status, // Now storing name directly
          assignedTo: options.assignedTo || "",
          tags: options.tags,
          notes: "",
          createdAt: now,
          lastUpdated: now,
        };

        batch.set(prospectRef, prospectData);
        imported++;
      }

      await batch.commit();
      return { success: true, imported, skipped };
    } catch (err: any) {
      console.error("Error importing prospects:", err);
      return {
        success: false,
        error: err.message || "Failed to import prospects",
      };
    }
  };

  // Filter prospects
  const filterProspects = (filter: ProspectsFilter): Prospect[] => {
    const activeStatuses = getActiveProspectStatuses();
    const activeSources = getActiveProspectSources();

    return prospects.filter((prospect) => {
      // Status filter - convert IDs to names for comparison
      if (filter.status && filter.status.length > 0) {
        const statusNames = filter.status.map((statusId) => {
          const status = activeStatuses.find((s) => s.id === statusId);
          return status ? status.name : statusId;
        });
        if (!statusNames.includes(prospect.status)) return false;
      }

      // Source filter - convert IDs to names for comparison
      if (filter.source && filter.source.length > 0) {
        const sourceNames = filter.source.map((sourceId) => {
          const source = activeSources.find((s) => s.id === sourceId);
          return source ? source.name : sourceId;
        });
        if (!sourceNames.includes(prospect.source)) return false;
      }

      // Assigned to filter
      if (filter.assignedTo && filter.assignedTo.length > 0) {
        if (!filter.assignedTo.includes(prospect.assignedTo || ""))
          return false;
      }

      // Date range filter
      if (filter.dateRange) {
        const prospectDate = prospect.createdAt.toDate();
        if (
          prospectDate < filter.dateRange.start ||
          prospectDate > filter.dateRange.end
        ) {
          return false;
        }
      }

      // Search term filter
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const nameMatch = prospect.name.toLowerCase().includes(searchLower);
        const phoneMatch = prospect.phoneNumber.includes(searchLower);
        const tagsMatch = prospect.tags.some((tag) =>
          tag.toLowerCase().includes(searchLower)
        );

        if (!nameMatch && !phoneMatch && !tagsMatch) return false;
      }

      return true;
    });
  };

  return {
    prospects,
    loading,
    error,
    addProspect,
    updateProspect,
    deleteProspect,
    bulkUpdateProspects,
    bulkDeleteProspects,
    importProspects,
    filterProspects,
    // Helper functions for database options
    getSourceOptions,
    getStatusOptions,
    getAssignedToOptions,
    // Direct access to database data
    prospectSources,
    prospectStatuses,
    users: users.filter((user) => user.isActive),
  };
};
