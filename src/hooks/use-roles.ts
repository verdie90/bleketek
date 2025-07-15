"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Role {
  id?: string;
  name: string;
  description: string;
  permissions: PermissionConfig[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface PermissionConfig {
  permissionId: string;
  actions: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
    download?: boolean;
    import?: boolean;
  };
  scope: "global" | "own";
}

export interface RolePermission {
  id: string;
  name: string;
  description: string;
  category: string;
  actions: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
    download?: boolean;
    import?: boolean;
  };
  scope: "global" | "own" | "both";
}

const defaultPermissions: RolePermission[] = [
  // Basic Access
  {
    id: "dashboard.view",
    name: "Dashboard Access",
    description: "Can access dashboard",
    category: "Basic Access",
    actions: { read: true },
    scope: "global",
  },

  // User Management
  {
    id: "users.manage",
    name: "Manage Users",
    description: "Can view, create, edit, and delete users",
    category: "User Management",
    actions: { create: true, read: true, update: true, delete: true },
    scope: "both",
  },
  {
    id: "roles.manage",
    name: "Manage Roles",
    description: "Can view, create, edit, and delete roles",
    category: "User Management",
    actions: { create: true, read: true, update: true, delete: true },
    scope: "global",
  },

  // Telemarketing
  {
    id: "prospects.manage",
    name: "Manage Prospects",
    description: "Can manage prospect data",
    category: "Telemarketing",
    actions: {
      create: true,
      read: true,
      update: true,
      delete: true,
      download: true,
    },
    scope: "both",
  },
  {
    id: "calls.manage",
    name: "Manage Phone Calls",
    description: "Can manage phone call logs",
    category: "Telemarketing",
    actions: {
      create: true,
      read: true,
      update: true,
      delete: true,
      download: true,
    },
    scope: "both",
  },
  {
    id: "scripts.manage",
    name: "Manage Scripts",
    description: "Can manage telemarketing scripts",
    category: "Telemarketing",
    actions: { create: true, read: true, update: true, delete: true },
    scope: "global",
  },
  {
    id: "telemarketing.settings",
    name: "Telemarketing Settings",
    description: "Can configure telemarketing settings",
    category: "Telemarketing",
    actions: { create: true, read: true, update: true, delete: true },
    scope: "global",
  },

  // Business Operations
  {
    id: "estimations.manage",
    name: "Manage Estimations",
    description: "Can manage estimation data",
    category: "Business Operations",
    actions: {
      create: true,
      read: true,
      update: true,
      delete: true,
      download: true,
    },
    scope: "both",
  },
  {
    id: "clients.manage",
    name: "Manage Clients",
    description: "Can manage client data",
    category: "Business Operations",
    actions: {
      create: true,
      read: true,
      update: true,
      delete: true,
      download: true,
    },
    scope: "both",
  },
  {
    id: "payments.manage",
    name: "Manage Payments",
    description: "Can manage payment records",
    category: "Business Operations",
    actions: {
      create: true,
      read: true,
      update: true,
      delete: true,
      download: true,
    },
    scope: "both",
  },
  {
    id: "reports.access",
    name: "Access Reports",
    description: "Can access reports and analytics",
    category: "Business Operations",
    actions: { read: true, download: true },
    scope: "both",
  },

  // Data Management
  {
    id: "data.export",
    name: "Export Data",
    description: "Can export system data to various formats",
    category: "Data Management",
    actions: { read: true, download: true },
    scope: "both",
  },
  {
    id: "data.import",
    name: "Import Data",
    description: "Can import data from external sources",
    category: "Data Management",
    actions: { create: true, import: true },
    scope: "global",
  },
  {
    id: "prospects.import",
    name: "Import Prospects",
    description: "Can import prospect data from files",
    category: "Data Management",
    actions: { create: true, import: true },
    scope: "both",
  },
  {
    id: "clients.import",
    name: "Import Clients",
    description: "Can import client data from files",
    category: "Data Management",
    actions: { create: true, import: true },
    scope: "both",
  },
  {
    id: "backup.manage",
    name: "Backup & Restore",
    description: "Can create backups and restore data",
    category: "Data Management",
    actions: { read: true, create: true, download: true, import: true },
    scope: "global",
  },

  // System Administration
  {
    id: "settings.manage",
    name: "System Settings",
    description: "Can manage system settings",
    category: "System Administration",
    actions: { create: true, read: true, update: true, delete: true },
    scope: "global",
  },
  {
    id: "system.admin",
    name: "System Administration",
    description: "Full system administration access",
    category: "System Administration",
    actions: { create: true, read: true, update: true, delete: true },
    scope: "global",
  },
];

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load roles from Firestore
  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const rolesQuery = query(collection(db, "roles"), orderBy("name"));
      const snapshot = await getDocs(rolesQuery);

      const rolesList: Role[] = [];
      snapshot.forEach((doc) => {
        rolesList.push({ id: doc.id, ...doc.data() } as Role);
      });

      setRoles(rolesList);
    } catch (err) {
      console.error("Error loading roles:", err);
      setError(err instanceof Error ? err.message : "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time listener for roles
  useEffect(() => {
    const rolesQuery = query(collection(db, "roles"), orderBy("name"));

    const unsubscribe = onSnapshot(
      rolesQuery,
      (snapshot) => {
        const rolesList: Role[] = [];
        snapshot.forEach((doc) => {
          rolesList.push({ id: doc.id, ...doc.data() } as Role);
        });
        setRoles(rolesList);
        setLoading(false);
      },
      (err) => {
        console.error("Error in roles listener:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Create new role
  const createRole = async (
    roleData: Omit<Role, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const docRef = await addDoc(collection(db, "roles"), {
        ...roleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true, id: docRef.id };
    } catch (err) {
      console.error("Error creating role:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create role",
      };
    }
  };

  // Update role
  const updateRole = async (roleId: string, roleData: Partial<Role>) => {
    try {
      const roleRef = doc(db, "roles", roleId);
      await updateDoc(roleRef, {
        ...roleData,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (err) {
      console.error("Error updating role:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update role",
      };
    }
  };

  // Delete role
  const deleteRole = async (roleId: string) => {
    try {
      // Check if role is being used by any users
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);

      let roleInUse = false;
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.role === roles.find((r) => r.id === roleId)?.name) {
          roleInUse = true;
        }
      });

      if (roleInUse) {
        return {
          success: false,
          error: "Cannot delete role that is assigned to users",
        };
      }

      const roleRef = doc(db, "roles", roleId);
      await deleteDoc(roleRef);

      return { success: true };
    } catch (err) {
      console.error("Error deleting role:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete role",
      };
    }
  };

  // Initialize default roles
  const initializeDefaultRoles = async () => {
    try {
      const defaultRoles: Omit<Role, "id" | "createdAt" | "updatedAt">[] = [
        {
          name: "Administrator",
          description: "Full system access with all permissions",
          permissions: defaultPermissions.map((p) => ({
            permissionId: p.id,
            actions: p.actions,
            scope: "global",
          })),
          isActive: true,
          createdBy: "system",
        },
        {
          name: "Manager",
          description: "Management level access with most permissions",
          permissions: [
            {
              permissionId: "dashboard.view",
              actions: { read: true },
              scope: "global",
            },
            {
              permissionId: "users.manage",
              actions: { create: true, read: true, update: true, delete: true },
              scope: "global",
            },
            {
              permissionId: "prospects.manage",
              actions: {
                create: true,
                read: true,
                update: true,
                delete: true,
                download: true,
              },
              scope: "global",
            },
            {
              permissionId: "calls.manage",
              actions: {
                create: true,
                read: true,
                update: true,
                delete: true,
                download: true,
              },
              scope: "global",
            },
            {
              permissionId: "scripts.manage",
              actions: { create: true, read: true, update: true, delete: true },
              scope: "global",
            },
            {
              permissionId: "telemarketing.settings",
              actions: { create: true, read: true, update: true, delete: true },
              scope: "global",
            },
            {
              permissionId: "estimations.manage",
              actions: {
                create: true,
                read: true,
                update: true,
                delete: true,
                download: true,
              },
              scope: "global",
            },
            {
              permissionId: "clients.manage",
              actions: {
                create: true,
                read: true,
                update: true,
                delete: true,
                download: true,
              },
              scope: "global",
            },
            {
              permissionId: "payments.manage",
              actions: {
                create: true,
                read: true,
                update: true,
                delete: true,
                download: true,
              },
              scope: "global",
            },
            {
              permissionId: "reports.access",
              actions: { read: true, download: true },
              scope: "global",
            },
            {
              permissionId: "data.export",
              actions: { read: true, download: true },
              scope: "global",
            },
            {
              permissionId: "data.import",
              actions: { create: true, import: true },
              scope: "global",
            },
            {
              permissionId: "prospects.import",
              actions: { create: true, import: true },
              scope: "global",
            },
            {
              permissionId: "clients.import",
              actions: { create: true, import: true },
              scope: "global",
            },
            {
              permissionId: "settings.manage",
              actions: { create: true, read: true, update: true, delete: true },
              scope: "global",
            },
          ],
          isActive: true,
          createdBy: "system",
        },
        {
          name: "Agent",
          description:
            "Agent level access for telemarketing and client management",
          permissions: [
            {
              permissionId: "dashboard.view",
              actions: { read: true },
              scope: "global",
            },
            {
              permissionId: "prospects.manage",
              actions: { create: true, read: true, update: true, delete: true },
              scope: "own",
            },
            {
              permissionId: "calls.manage",
              actions: { create: true, read: true, update: true, delete: true },
              scope: "own",
            },
            {
              permissionId: "estimations.manage",
              actions: { create: true, read: true, update: true, delete: true },
              scope: "own",
            },
            {
              permissionId: "clients.manage",
              actions: { read: true, update: true },
              scope: "own",
            },
            {
              permissionId: "reports.access",
              actions: { read: true },
              scope: "own",
            },
          ],
          isActive: true,
          createdBy: "system",
        },
        {
          name: "Viewer",
          description: "Read-only access to view data",
          permissions: [
            {
              permissionId: "dashboard.view",
              actions: { read: true },
              scope: "global",
            },
            {
              permissionId: "reports.access",
              actions: { read: true },
              scope: "own",
            },
          ],
          isActive: true,
          createdBy: "system",
        },
      ];

      for (const role of defaultRoles) {
        await createRole(role);
      }

      return { success: true };
    } catch (err) {
      console.error("Error initializing default roles:", err);
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to initialize default roles",
      };
    }
  };

  // Get active roles
  const getActiveRoles = useCallback(() => {
    return roles.filter((role) => role.isActive);
  }, [roles]);

  // Get role by name
  const getRoleByName = useCallback(
    (name: string) => {
      return roles.find((role) => role.name === name);
    },
    [roles]
  );

  // Check if user has permission
  const hasPermission = useCallback(
    (
      userRole: string,
      permissionId: string,
      action?: "create" | "read" | "update" | "delete" | "download" | "import",
      scope?: "global" | "own"
    ) => {
      const role = getRoleByName(userRole);
      if (!role) return false;

      const permission = role.permissions.find(
        (p) => p.permissionId === permissionId
      );
      if (!permission) return false;

      // Check if action is allowed (if specified)
      if (action && !permission.actions[action]) return false;

      // Check if scope is compatible (if specified)
      if (scope && scope === "global" && permission.scope === "own")
        return false;

      return true;
    },
    [getRoleByName]
  );

  // Check if user has specific action permission
  const hasActionPermission = useCallback(
    (
      userRole: string,
      permissionId: string,
      action: "create" | "read" | "update" | "delete" | "download" | "import"
    ) => {
      return hasPermission(userRole, permissionId, action);
    },
    [hasPermission]
  );

  // Check if user has global scope permission
  const hasGlobalPermission = useCallback(
    (userRole: string, permissionId: string) => {
      const role = getRoleByName(userRole);
      if (!role) return false;

      const permission = role.permissions.find(
        (p) => p.permissionId === permissionId
      );
      return permission ? permission.scope === "global" : false;
    },
    [getRoleByName]
  );

  // Get available permissions
  const getAvailablePermissions = useCallback(() => {
    return defaultPermissions;
  }, []);

  // Get permissions by category
  const getPermissionsByCategory = useCallback(() => {
    const categories: Record<string, RolePermission[]> = {};

    defaultPermissions.forEach((permission) => {
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });

    return categories;
  }, []);

  return {
    roles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    loadRoles,
    initializeDefaultRoles,
    getActiveRoles,
    getRoleByName,
    hasPermission,
    hasActionPermission,
    hasGlobalPermission,
    getAvailablePermissions,
    getPermissionsByCategory,
  };
}
