"use client";
import React, { createContext, useState, useEffect } from "react";
import api from "../lib/api";
import { useRouter } from "next/navigation";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Fetch current logged-in user
  const fetchMe = async () => {
    try {
      const token = localStorage.getItem("token"); // check token
      if (!token) return setUser(null);

      const { data } = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data.user);
    } catch {
      setUser(null);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      
      // 1️⃣ Store token in localStorage
      localStorage.setItem("token", data.token); // assuming backend returns { token, user }

      setUser(data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert("Login failed");
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await api.post("/auth/logout", null, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      localStorage.removeItem("token");
      setUser(null);
      router.push("/auth/login");
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert("Logout failed");
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}
