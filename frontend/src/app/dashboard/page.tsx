"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { TodoForm } from "@/components/TodoForm";
import TodosList from "@/components/TodosList";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
;

export default function DashboardPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  

  // Fetch users for assignees
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data;
    },
    // Ensure this only runs on client
    enabled: typeof window !== "undefined",
  });

  const handleTodoSuccess = () => setShowCreateForm(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-global text-black flex flex-col">
        {/* Navbar */}
        <Navbar />

        <div className="h-12" />

        {/* Create Todo Section */}
        <div className="px-6">
          <div className="bg-blue-200 border-2 border-blue-300 shadow-lg p-6 min-h-[60vh] rotate-[0.5deg]">
            <button
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="px-6 py-3 bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition w-fit"
            >
              {showCreateForm ? "Close Todo Form" : "Create New Todo"}
            </button>
            {showCreateForm && users.length > 0 && (
              <div className="mt-6">
                <TodoForm onSuccess={handleTodoSuccess} users={users} />
              </div>
            )}
          </div>
        </div>

        <div className="h-12" />

        {/* Todos Section */}
        <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-purple-100 border-2 border-purple-300 shadow-lg p-6 min-h-[30vh] -rotate-[0.5deg]">
            <h2 className="text-xl font-bold mb-4">My Todos</h2>
            <TodosList filter="myTodos" />
          </div>

          <div className="bg-yellow-100 border-2 border-yellow-300 shadow-lg p-6 min-h-[30vh] rotate-[0.5deg]">
            <h2 className="text-xl font-bold mb-4">Assigned Todos</h2>
            <TodosList filter="assignedTodos" />
          </div>
        </div>

        

        
      </div>
    </ProtectedRoute>
  );
}
