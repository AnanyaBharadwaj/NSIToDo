// frontend/app/adminUsers/page.tsx
"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { AdminUsers } from "@/components/AdminUsers";

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-gray-50 text-black flex flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Spacer after Navbar */}
        <div className="h-12" />

        {/* Page Header */}
        <div className="px-6">
          <h1 className="text-2xl font-bold mb-6">Admin: Users Management</h1>
        </div>

        {/* Admin Users Table */}
        <div className="px-6">
          <div className="bg-white border-2 border-gray-200 shadow-lg p-6 rounded-md">
            <AdminUsers />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
