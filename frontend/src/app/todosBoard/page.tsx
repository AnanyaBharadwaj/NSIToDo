"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { TodosBoard } from "@/components/TodosBoard";

export default function TodosBoardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Navbar with NotificationsBell */}
        <Navbar />

        {/* Page Content */}
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">Todos Board</h1>
          <TodosBoard />
        </div>
      </div>
    </ProtectedRoute>
  );
}
