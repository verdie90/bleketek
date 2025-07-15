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
  passwordHash?: string; // Store hashed password
}

export interface UserActivity {
  id?: string;
  userId: string;
  userEmail: string;
  action: string;
  description: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all users
  const loadUsers = async () => {
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
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  // Create new user
  const createUser = async (
    userData: Omit<User, "id" | "uid" | "createdAt" | "updatedAt">,
    password: string
  ) => {
    try {
      // Hash the password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Save user data to Firestore with hashed password
      const now = Timestamp.now();
      const userDoc = {
        ...userData,
        passwordHash, // Store hashed password
        isEmailVerified: false, // Default to false, can be updated later
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, "users"), userDoc);

      // Log activity
      await logUserActivity(
        docRef.id,
        userData.email,
        "create_user",
        "User account created"
      );

      await loadUsers();
      return { success: true, uid: docRef.id };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create user" };
    }
  };

  // Update user
  const updateUser = async (id: string, userData: Partial<User>) => {
    try {
      await updateDoc(doc(db, "users", id), {
        ...userData,
        updatedAt: Timestamp.now(),
      });

      // Log activity
      const user = users.find((u) => u.id === id);
      if (user) {
        await logUserActivity(
          user.id || "",
          user.email,
          "update_profile",
          "User profile updated"
        );
      }

      await loadUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update user" };
    }
  };

  // Delete user
  const deleteUserAccount = async (id: string) => {
    try {
      const user = users.find((u) => u.id === id);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Delete from Firestore
      await deleteDoc(doc(db, "users", id));

      // Log activity
      await logUserActivity(
        user.id || "",
        user.email,
        "delete_user",
        "User account deleted"
      );

      await loadUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to delete user" };
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (id: string) => {
    try {
      const user = users.find((u) => u.id === id);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      const newStatus = !user.isActive;
      await updateDoc(doc(db, "users", id), {
        isActive: newStatus,
        updatedAt: Timestamp.now(),
      });

      // Log activity
      await logUserActivity(
        user.id || "",
        user.email,
        newStatus ? "activate_user" : "deactivate_user",
        `User account ${newStatus ? "activated" : "deactivated"}`
      );

      await loadUsers();
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to toggle user status",
      };
    }
  };

  // Send password reset email (simplified version - just log the action)
  const sendPasswordReset = async (email: string) => {
    try {
      // In a real implementation, you would send an email here
      // For now, we'll just log the action

      // Log activity
      const user = users.find((u) => u.email === email);
      if (user) {
        await logUserActivity(
          user.id || "",
          email,
          "password_reset_sent",
          "Password reset email sent"
        );
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to send password reset email",
      };
    }
  };

  // Log user activity
  const logUserActivity = async (
    userId: string,
    userEmail: string,
    action: string,
    description: string
  ) => {
    try {
      await addDoc(collection(db, "user_activities"), {
        userId,
        userEmail,
        action,
        description,
        timestamp: Timestamp.now(),
        ipAddress: "Unknown", // You can implement IP detection
        userAgent: navigator.userAgent,
      });
    } catch (err) {
    }
  };

  // Get user by email
  const getUserByEmail = (email: string) => {
    return users.find((user) => user.email === email);
  };

  // Get user by ID
  const getUserById = (id: string) => {
    return users.find((user) => user.id === id);
  };

  // Get users by role
  const getUsersByRole = (role: string) => {
    return users.filter((user) => user.role === role);
  };

  // Get active users count
  const getActiveUsersCount = () => {
    return users.filter((user) => user.isActive).length;
  };

  // Get recent activities
  const getRecentActivities = (limit: number = 10) => {
    return userActivities.slice(0, limit);
  };

  // Search users
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
      },
      (err) => {
        setError("Failed to sync users");
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
      }
    );

    // Initial load
    loadUsers();
    loadUserActivities();

    return () => {
      unsubscribeUsers();
      unsubscribeActivities();
    };
  }, []);

  return {
    // Data
    users,
    userActivities,
    loading,
    error,

    // User operations
    createUser,
    updateUser,
    deleteUserAccount,
    toggleUserStatus,
    sendPasswordReset,

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
