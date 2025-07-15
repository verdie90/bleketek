"use client";

import { useState, useEffect, useCallback } from "react";
import { Timestamp } from "firebase/firestore";

export interface User {
  id?: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLogin?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profileImage?: string;
  department?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      // Verify token with API
      verifyToken(token);
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Verify token with server
  const verifyToken = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      // Check if response is ok
      if (!response.ok) {
        console.error("Verify token failed:", response.status);
        logout();
        return;
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Non-JSON response from verify endpoint");
        logout();
        return;
      }

      const data = await response.json();

      if (data.success) {
        setAuthState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        logout();
      }
    } catch (error) {
      console.error("Token verification error:", error);
      logout();
    }
  };

  // Login function
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthResult> => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        console.log("Attempting login with:", { email: credentials.email });

        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

        // Check if response is ok
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          const errorMessage = `Server error: ${response.status}`;
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
          }));
          return { success: false, error: errorMessage };
        }

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const responseText = await response.text();
          console.error("Non-JSON response:", responseText);
          const errorMessage = "Server returned invalid response";
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
          }));
          return { success: false, error: errorMessage };
        }

        const data = await response.json();
        console.log("Response data:", data);

        if (data.success) {
          // Store JWT token
          localStorage.setItem("auth_token", data.token);

          // Update auth state
          setAuthState({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true, user: data.user };
        } else {
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
            error: data.error,
          }));
          return { success: false, error: data.error };
        }
      } catch (error) {
        console.error("Login error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Login failed";
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");

    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  // Check if user has specific role
  const hasRole = useCallback(
    (role: string): boolean => {
      return authState.user?.role === role;
    },
    [authState.user]
  );

  // Check if user has specific permission
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return authState.user?.role === "Administrator";
    },
    [authState.user]
  );

  return {
    ...authState,
    login,
    logout,
    hasRole,
    hasPermission,
  };
}
