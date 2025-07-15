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
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Role {
  id?: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  isActive: boolean;
  color: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Permission {
  id?: string;
  name: string;
  displayName: string;
  description: string;
  module: string;
  action: "create" | "read" | "update" | "delete" | "execute";
  resource: string;
  isSystemPermission: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  roleId: string;
  roleName: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  notes?: string;
}

export function useRolesPermissions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load roles
      const rolesSnapshot = await getDocs(
        query(collection(db, "roles"), orderBy("priority", "asc"))
      );
      const rolesData = rolesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Role[];
      setRoles(rolesData);

      // Load permissions
      const permissionsSnapshot = await getDocs(
        query(collection(db, "permissions"), orderBy("module", "asc"))
      );
      const permissionsData = permissionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Permission[];
      setPermissions(permissionsData);

      // Load user roles
      const userRolesSnapshot = await getDocs(
        query(collection(db, "user_roles"), orderBy("assignedAt", "desc"))
      );
      const userRolesData = userRolesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        assignedAt: doc.data().assignedAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate(),
      })) as UserRole[];
      setUserRoles(userRolesData);
    } catch (err) {
      console.error("Error loading roles and permissions:", err);
      setError("Failed to load roles and permissions");
    } finally {
      setLoading(false);
    }
  };

  // Role CRUD operations
  const createRole = async (
    roleData: Omit<Role, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const now = Timestamp.now();
      await addDoc(collection(db, "roles"), {
        ...roleData,
        createdAt: now,
        updatedAt: now,
      });
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error creating role:", err);
      return { success: false, error: "Failed to create role" };
    }
  };

  const updateRole = async (id: string, roleData: Partial<Role>) => {
    try {
      await updateDoc(doc(db, "roles", id), {
        ...roleData,
        updatedAt: Timestamp.now(),
      });
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error updating role:", err);
      return { success: false, error: "Failed to update role" };
    }
  };

  const deleteRole = async (id: string) => {
    try {
      // Check if role is assigned to users
      const assignedUsers = userRoles.filter(
        (ur) => ur.roleId === id && ur.isActive
      );
      if (assignedUsers.length > 0) {
        return {
          success: false,
          error: `Role is assigned to ${assignedUsers.length} users`,
        };
      }

      await deleteDoc(doc(db, "roles", id));
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error deleting role:", err);
      return { success: false, error: "Failed to delete role" };
    }
  };

  // Permission CRUD operations
  const createPermission = async (
    permissionData: Omit<Permission, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const now = Timestamp.now();
      await addDoc(collection(db, "permissions"), {
        ...permissionData,
        createdAt: now,
        updatedAt: now,
      });
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error creating permission:", err);
      return { success: false, error: "Failed to create permission" };
    }
  };

  const updatePermission = async (
    id: string,
    permissionData: Partial<Permission>
  ) => {
    try {
      await updateDoc(doc(db, "permissions", id), {
        ...permissionData,
        updatedAt: Timestamp.now(),
      });
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error updating permission:", err);
      return { success: false, error: "Failed to update permission" };
    }
  };

  const deletePermission = async (id: string) => {
    try {
      await deleteDoc(doc(db, "permissions", id));
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error deleting permission:", err);
      return { success: false, error: "Failed to delete permission" };
    }
  };

  // User Role operations
  const assignUserRole = async (
    userRoleData: Omit<UserRole, "id" | "assignedAt">
  ) => {
    try {
      const now = Timestamp.now();
      await addDoc(collection(db, "user_roles"), {
        ...userRoleData,
        assignedAt: now,
      });
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error assigning user role:", err);
      return { success: false, error: "Failed to assign user role" };
    }
  };

  const updateUserRole = async (
    id: string,
    userRoleData: Partial<UserRole>
  ) => {
    try {
      await updateDoc(doc(db, "user_roles", id), userRoleData);
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error updating user role:", err);
      return { success: false, error: "Failed to update user role" };
    }
  };

  const revokeUserRole = async (id: string) => {
    try {
      await updateDoc(doc(db, "user_roles", id), {
        isActive: false,
      });
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error revoking user role:", err);
      return { success: false, error: "Failed to revoke user role" };
    }
  };

  const deleteUserRole = async (id: string) => {
    try {
      await deleteDoc(doc(db, "user_roles", id));
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error deleting user role:", err);
      return { success: false, error: "Failed to delete user role" };
    }
  };

  // Role permissions management
  const updateRolePermissions = async (
    roleId: string,
    permissionIds: string[]
  ) => {
    try {
      await updateDoc(doc(db, "roles", roleId), {
        permissions: permissionIds,
        updatedAt: Timestamp.now(),
      });
      await loadData();
      return { success: true };
    } catch (err) {
      console.error("Error updating role permissions:", err);
      return { success: false, error: "Failed to update role permissions" };
    }
  };

  // Utility functions
  const getRoleById = (roleId: string) => {
    return roles.find((r) => r.id === roleId);
  };

  const getPermissionById = (permissionId: string) => {
    return permissions.find((p) => p.id === permissionId);
  };

  const getPermissionsByRole = (roleId: string) => {
    const role = getRoleById(roleId);
    if (!role) return [];

    if (role.permissions.includes("*")) {
      return permissions; // All permissions
    }

    return permissions.filter((p) => role.permissions.includes(p.id || ""));
  };

  const getUserRolesByUser = (userId: string) => {
    return userRoles.filter((ur) => ur.userId === userId && ur.isActive);
  };

  const getUserRolesByRole = (roleId: string) => {
    return userRoles.filter((ur) => ur.roleId === roleId && ur.isActive);
  };

  const checkUserPermission = (userId: string, permissionName: string) => {
    const activeUserRoles = getUserRolesByUser(userId);

    for (const userRole of activeUserRoles) {
      const role = getRoleById(userRole.roleId);
      if (!role || !role.isActive) continue;

      // Super admin check
      if (role.permissions.includes("*")) return true;

      // Check specific permission
      const hasPermission = role.permissions.some((permId) => {
        const permission = getPermissionById(permId);
        return permission?.name === permissionName;
      });

      if (hasPermission) return true;
    }

    return false;
  };

  const getActiveUserCount = (roleId: string) => {
    return getUserRolesByRole(roleId).length;
  };

  // Real-time listeners
  useEffect(() => {
    const unsubscribeRoles = onSnapshot(
      query(collection(db, "roles"), orderBy("priority", "asc")),
      (snapshot) => {
        const rolesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Role[];
        setRoles(rolesData);
      },
      (err) => {
        console.error("Error listening to roles:", err);
        setError("Failed to sync roles");
      }
    );

    const unsubscribePermissions = onSnapshot(
      query(collection(db, "permissions"), orderBy("module", "asc")),
      (snapshot) => {
        const permissionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Permission[];
        setPermissions(permissionsData);
      },
      (err) => {
        console.error("Error listening to permissions:", err);
        setError("Failed to sync permissions");
      }
    );

    const unsubscribeUserRoles = onSnapshot(
      query(collection(db, "user_roles"), orderBy("assignedAt", "desc")),
      (snapshot) => {
        const userRolesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          assignedAt: doc.data().assignedAt?.toDate() || new Date(),
          expiresAt: doc.data().expiresAt?.toDate(),
        })) as UserRole[];
        setUserRoles(userRolesData);
      },
      (err) => {
        console.error("Error listening to user roles:", err);
        setError("Failed to sync user roles");
      }
    );

    // Initial load
    loadData();

    return () => {
      unsubscribeRoles();
      unsubscribePermissions();
      unsubscribeUserRoles();
    };
  }, []);

  return {
    // Data
    roles,
    permissions,
    userRoles,
    loading,
    error,

    // Role operations
    createRole,
    updateRole,
    deleteRole,

    // Permission operations
    createPermission,
    updatePermission,
    deletePermission,

    // User role operations
    assignUserRole,
    updateUserRole,
    revokeUserRole,
    deleteUserRole,

    // Role permissions
    updateRolePermissions,

    // Utility functions
    getRoleById,
    getPermissionById,
    getPermissionsByRole,
    getUserRolesByUser,
    getUserRolesByRole,
    checkUserPermission,
    getActiveUserCount,

    // Manual refresh
    loadData,
  };
}
