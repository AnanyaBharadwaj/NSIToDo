"use client";

import { useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { TodoForm } from "../../components/TodoForm";
import TodosList from "../../components/TodosList";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";

export default function Page() {
  const [showRegister, setShowRegister] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch users for assignees
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data;
    },
  });

  // Todo create success handler
  const handleTodoSuccess = () => setShowCreateForm(false);

  return (
    <ProtectedRoute>
      <div className="dashboard-container">
        <h1>Dashboard</h1>

        {/* Toggle between login/register */}
        {showRegister ? (
          <div>
            <h2>Register</h2>
            {/* Your Register form component */}
            <button onClick={() => setShowRegister(false)}>Back to Login</button>
          </div>
        ) : (
          <div>
            <h2>Login</h2>
            {/* Your Login form component */}
            <button onClick={() => setShowRegister(true)}>Go to Register</button>
          </div>
        )}

        {/* Todo Form */}
        <button onClick={() => setShowCreateForm(prev => !prev)}>
          {showCreateForm ? "Close Todo Form" : "Create New Todo"}
        </button>
        {showCreateForm && users.length > 0 && (
          <TodoForm onSuccess={handleTodoSuccess} users={users} />
        )}

        {/* Todo Lists */}
        <div style={{ display: "flex", gap: "2rem" }}>
          <div>
            <h2>My Todos</h2>
            <TodosList filter="myTodos" />
          </div>
          <div>
            <h2>Assigned Todos</h2>
            <TodosList filter="assignedTodos" />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
