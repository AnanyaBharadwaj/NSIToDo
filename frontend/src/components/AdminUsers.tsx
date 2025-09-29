// frontend/components/AdminUsers.tsx
"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
}

const fetchUsers = async (): Promise<User[]> => {
  const { data } = await api.get<User[]>("/admin/users");
  return data;
};

export const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, isError, error } = useQuery<User[], Error>({
    queryKey: ["admin", "users"],
    queryFn: fetchUsers,
    staleTime: 5000,
  });

  const toggleMutation = useMutation<
    User, // returned data
    Error, // error type
    { id: number; status: "ACTIVE" | "DISABLED" }, // variables
    { previous?: User[] } // context for optimistic update
  >({
    mutationFn: ({ id, status }) =>
      api
        .patch<User>(`/admin/users/${id}/status`, { status })
        .then((res) => res.data),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "users"] });
      const previous = queryClient.getQueryData<User[]>(["admin", "users"]);

      if (previous) {
        const newUsers = previous.map((u) =>
          u.id === id ? { ...u, status } : u
        );
        queryClient.setQueryData(["admin", "users"], newUsers);
      }

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["admin", "users"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  if (isLoading) return <div>Loading users...</div>;
  if (isError) return <div style={{ color: "red" }}>Error: {error.message}</div>;

  return (
    <div>
      <h2>Users</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td>{new Date(u.createdAt).toLocaleString()}</td>
              <td>
                <button
                  onClick={() =>
                    toggleMutation.mutate({
                      id: u.id,
                      status: u.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                    })
                  }
                  disabled={toggleMutation.isPending}
                  className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                >
                  {u.status === "ACTIVE" ? "Disable" : "Enable"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
