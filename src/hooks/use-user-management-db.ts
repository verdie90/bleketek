"use client";

import { useState, useEffect, useCallback } from "react";
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
  serverTimestamp,
} from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "@/lib/firebase";

export interface User {
  id?: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  position: string;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  permissions?: string[];
  notes?: string;
  passwordHash: string; // bcrypt hashed password
}

export interface UserActivity {
  id?: string;
  userId: string;
  userEmail: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load users from Firestore
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const usersSnapshot = await getDocs(
        query(collection(db, "users"), orderBy("createdAt", "desc"))
      );

      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastLoginAt: doc.data().lastLoginAt?.toDate(),
      })) as User[];

      setUsers(usersData);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user activities
  const loadUserActivities = async (userId?: string) => {
    try {
      let activitiesQuery = query(
        collection(db, "user_activities"),
        orderBy("timestamp", "desc")
      );

      if (userId) {
        activitiesQuery = query(
          collection(db, "user_activities"),
          where("userId", "==", userId),
          orderBy("timestamp", "desc")
        );
      }

      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activitiesData = activitiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as UserActivity[];

      setUserActivities(activitiesData);
    } catch (err) {
      console.error("Error loading user activities:", err);
    }
  };

  // Create new user (database only)
  const createUser = async (
    userData: Omit<User, "id" | "createdAt" | "updatedAt" | "passwordHash">,
    password: string
  ) => {
    try {
      // Hash the password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate a unique ID
      const userId = `user_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Save user data to Firestore
      const userDoc = {
        ...userData,
        passwordHash,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "users"), userDoc);

      // Log activity
      await logUserActivity({
        userId: docRef.id,
        userEmail: userData.email,
        action: "user_created",
        description: `User ${userData.displayName} was created`,
        metadata: {
          role: userData.role,
          position: userData.position,
        },
        timestamp: new Date(),
      });

      return { success: true, id: docRef.id };
    } catch (err) {
      console.error("Error creating user:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create user",
      };
    }
  };

  // Update user
  const updateUser = async (userId: string, userData: Partial<User>) => {
    try {
      const userRef = doc(db, "users", userId);
      const updateData = {
        ...userData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userRef, updateData);

      // Log activity
      const user = users.find((u) => u.id === userId);
      if (user) {
        await logUserActivity({
          userId,
          userEmail: user.email,
          action: "user_updated",
          description: `User ${user.displayName} was updated`,
          metadata: userData,
          timestamp: new Date(),
        });
      }

      return { success: true };
    } catch (err) {
      console.error("Error updating user:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update user",
      };
    }
  };

  // Delete user (database only)
  const deleteUserAccount = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Delete from Firestore
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);

      // Log activity
      await logUserActivity({
        userId,
        userEmail: user.email,
        action: "user_deleted",
        description: `User ${user.displayName} was deleted`,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (err) {
      console.error("Error deleting user:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete user",
      };
    }
  };

  // Toggle user status
  const toggleUserStatus = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      const newStatus = !user.isActive;
      const userRef = doc(db, "users", userId);

      await updateDoc(userRef, {
        isActive: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await logUserActivity({
        userId,
        userEmail: user.email,
        action: newStatus ? "user_activated" : "user_deactivated",
        description: `User ${user.displayName} was ${
          newStatus ? "activated" : "deactivated"
        }`,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (err) {
      console.error("Error toggling user status:", err);
      return {
        success: false,
        error:
          err instanceof Error ? err.message : "Failed to update user status",
      };
    }
  };

  // Reset password (database only)
  const resetPassword = async (userId: string, newPassword: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Hash the new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        passwordHash,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await logUserActivity({
        userId,
        userEmail: user.email,
        action: "password_reset",
        description: `Password was reset for user ${user.displayName}`,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (err) {
      console.error("Error resetting password:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to reset password",
      };
    }
  };

  // Verify password
  const verifyPassword = async (email: string, password: string) => {
    try {
      const user = users.find((u) => u.email === email);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (isValid) {
        // Update last login
        const userRef = doc(db, "users", user.id!);
        await updateDoc(userRef, {
          lastLoginAt: serverTimestamp(),
        });

        // Log activity
        await logUserActivity({
          userId: user.id!,
          userEmail: user.email,
          action: "user_login",
          description: `User ${user.displayName} logged in`,
          timestamp: new Date(),
        });
      }

      return { success: isValid, user: isValid ? user : null };
    } catch (err) {
      console.error("Error verifying password:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to verify password",
      };
    }
  };

  // Log user activity
  const logUserActivity = async (activity: Omit<UserActivity, "id">) => {
    try {
      await addDoc(collection(db, "user_activities"), {
        ...activity,
        timestamp: activity.timestamp || serverTimestamp(),
      });
    } catch (err) {
      console.error("Error logging user activity:", err);
    }
  };

  // Utility functions
  const getUserByEmail = (email: string) => {
    return users.find((user) => user.email === email);
  };

  const getUserById = (id: string) => {
    return users.find((user) => user.id === id);
  };

  const getUsersByRole = (role: string) => {
    return users.filter((user) => user.role === role);
  };

  const getActiveUsersCount = () => {
    return users.filter((user) => user.isActive).length;
  };

  const getRecentActivities = (limit: number = 10) => {
    return userActivities.slice(0, limit);
  };

  const searchUsers = (searchTerm: string) => {
    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.position.toLowerCase().includes(term)
    );
  };

  // Real-time listeners
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      query(collection(db, "users"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          lastLoginAt: doc.data().lastLoginAt?.toDate(),
        })) as User[];

        setUsers(usersData);
        setLoading(false);
      },
      (err) => {
        console.error("Error in users listener:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    const unsubscribeActivities = onSnapshot(
      query(collection(db, "user_activities"), orderBy("timestamp", "desc")),
      (snapshot) => {
        const activitiesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as UserActivity[];

        setUserActivities(activitiesData);
      },
      (err) => {
        console.error("Error in activities listener:", err);
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeActivities();
    };
  }, []);

  return {
    // State
    users,
    userActivities,
    loading,
    error,

    // User operations
    createUser,
    updateUser,
    deleteUserAccount,
    toggleUserStatus,
    resetPassword,
    verifyPassword,

    // Utility functions
    getUserByEmail,
    getUserById,
    getUsersByRole,
    getActiveUsersCount,
    getRecentActivities,
    searchUsers,
    logUserActivity,

    // Data loading
    loadUsers,
    loadUserActivities,
  };
}
