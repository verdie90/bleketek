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
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "@/hooks/use-auth";
import { hashPassword } from "@/lib/auth-utils";

export interface CreateUserData {
  username: string;
  email: string;
  fullName: string;
  password?: string; // Make password optional for updates
  role: string;
  isActive: boolean;
  department?: string;
  phone?: string;
}

export interface UserResult {
  success: boolean;
  error?: string;
  user?: User;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load users from Firestore with real-time updates
  useEffect(() => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];

        setUsers(usersData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error loading users:", err);
        setError("Failed to load users");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Create new user
  const createUser = useCallback(
    async (userData: CreateUserData): Promise<UserResult> => {
      try {
        // Check if username already exists
        const usersRef = collection(db, "users");
        const usernameQuery = query(
          usersRef,
          where("username", "==", userData.username)
        );
        const usernameSnapshot = await getDocs(usernameQuery);

        if (!usernameSnapshot.empty) {
          return { success: false, error: "Username sudah digunakan" };
        }

        // Check if email already exists
        const emailQuery = query(
          usersRef,
          where("email", "==", userData.email)
        );
        const emailSnapshot = await getDocs(emailQuery);

        if (!emailSnapshot.empty) {
          return { success: false, error: "Email sudah digunakan" };
        }

        // Hash password if provided
        const hashedPassword = userData.password
          ? await hashPassword(userData.password)
          : undefined;

        const newUser = {
          ...userData,
          password: hashedPassword,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(usersRef, newUser);

        return {
          success: true,
          user: {
            id: docRef.id,
            ...userData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
        };
      } catch (err) {
        console.error("Error creating user:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to create user",
        };
      }
    },
    []
  );

  // Update user
  const updateUser = useCallback(
    async (
      userId: string,
      updates: Partial<CreateUserData>
    ): Promise<UserResult> => {
      try {
        // If updating username or email, check for conflicts
        if (updates.username) {
          const usersRef = collection(db, "users");
          const usernameQuery = query(
            usersRef,
            where("username", "==", updates.username)
          );
          const usernameSnapshot = await getDocs(usernameQuery);

          // Check if username is used by another user
          const existingUser = usernameSnapshot.docs.find(
            (doc) => doc.id !== userId
          );
          if (existingUser) {
            return { success: false, error: "Username sudah digunakan" };
          }
        }

        if (updates.email) {
          const usersRef = collection(db, "users");
          const emailQuery = query(
            usersRef,
            where("email", "==", updates.email)
          );
          const emailSnapshot = await getDocs(emailQuery);

          // Check if email is used by another user
          const existingUser = emailSnapshot.docs.find(
            (doc) => doc.id !== userId
          );
          if (existingUser) {
            return { success: false, error: "Email sudah digunakan" };
          }
        }

        // Hash password if it's being updated
        let updateData = { ...updates };
        if (updates.password) {
          updateData.password = await hashPassword(updates.password);
        }

        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          ...updateData,
          updatedAt: serverTimestamp(),
        });

        return { success: true };
      } catch (err) {
        console.error("Error updating user:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to update user",
        };
      }
    },
    []
  );

  // Delete user
  const deleteUser = useCallback(
    async (userId: string): Promise<UserResult> => {
      try {
        const userRef = doc(db, "users", userId);
        await deleteDoc(userRef);

        return { success: true };
      } catch (err) {
        console.error("Error deleting user:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to delete user",
        };
      }
    },
    []
  );

  // Toggle user active status
  const toggleUserStatus = useCallback(
    async (userId: string, isActive: boolean): Promise<UserResult> => {
      return updateUser(userId, { isActive });
    },
    [updateUser]
  );

  // Get users by role
  const getUsersByRole = useCallback(
    (role: string) => {
      return users.filter((user) => user.role === role);
    },
    [users]
  );

  // Get active users
  const getActiveUsers = useCallback(() => {
    return users.filter((user) => user.isActive);
  }, [users]);

  // Search users
  const searchUsers = useCallback(
    (searchTerm: string) => {
      if (!searchTerm) return users;

      const term = searchTerm.toLowerCase();
      return users.filter(
        (user) =>
          user.username.toLowerCase().includes(term) ||
          user.fullName.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.role.toLowerCase().includes(term)
      );
    },
    [users]
  );

  // Initialize default admin user (call this once)
  const initializeDefaultAdmin = useCallback(async (): Promise<UserResult> => {
    try {
      // Check if admin user already exists
      const usersRef = collection(db, "users");
      const adminQuery = query(usersRef, where("username", "==", "admin"));
      const adminSnapshot = await getDocs(adminQuery);

      if (!adminSnapshot.empty) {
        return { success: true, error: "Admin user already exists" };
      }

      // Create default admin user
      const adminUser: CreateUserData = {
        username: "admin",
        email: "admin@company.com",
        fullName: "System Administrator",
        password: "admin123", // Change this in production!
        role: "Administrator",
        isActive: true,
        department: "IT",
        phone: "-",
      };

      return await createUser(adminUser);
    } catch (error) {
      console.error("Error creating default admin:", error);
      return {
        success: false,
        error: "Failed to create default admin user",
      };
    }
  }, [createUser]);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getUsersByRole,
    getActiveUsers,
    searchUsers,
    initializeDefaultAdmin,
  };
}
