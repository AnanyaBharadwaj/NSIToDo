"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";

interface TodoResponse {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  files?: { id: number; filename: string }[];
  status: "TODO" | "IN_PROGRESS" | "DONE";
}

const TodoPage: React.FC = () => {
  const params = useParams();
  const todoId = Number(params.id);
  const queryClient = useQueryClient();

  const {
    data: todo,
    isLoading,
    error,
  } = useQuery<TodoResponse, Error>({
    queryKey: ["todo", todoId],
    queryFn: async () => {
      const response = await api.get<TodoResponse>(`/todos/${todoId}`);
      return response.data;
    },
    enabled: !!todoId,
  });

  const mutation = useMutation<
    TodoResponse,
    Error,
    { id: number; status: TodoResponse["status"] }
  >({
    mutationFn: async ({ id, status }) => {
      const response = await api.patch<TodoResponse>(`/todos/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todo", todoId] });
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  if (isLoading) return <p className="text-center text-gray-400 mt-20">Loading...</p>;
  if (error) return <p className="text-center text-red-500 mt-20">Error: {error.message}</p>;
  if (!todo) return <p className="text-center text-gray-400 mt-20">Todo not found</p>;

  const handleStatusChange = (newStatus: TodoResponse["status"]) => {
    mutation.mutate({ id: todo.id, status: newStatus });
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "DONE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Navbar />
      <div className="bg-gray-900 min-h-[calc(100vh-64px)] py-10 px-6 flex justify-center">
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-10 space-y-8">
          {/* Title */}
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
            {todo.title}
          </h1>

          {/* Status */}
          <div className="flex items-center gap-6">
            <span
              className={`px-4 py-2 text-sm font-semibold rounded-full ${getBadgeColor(
                todo.status
              )}`}
            >
              {todo.status}
            </span>

            <select
              value={todo.status}
              onChange={(e) =>
                handleStatusChange(e.target.value as TodoResponse["status"])
              }
              className="border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="DONE">DONE</option>
            </select>
          </div>

          {/* Description */}
          {todo.description && (
            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-inner">
              <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Description
              </h2>
              <p className="text-gray-700 dark:text-gray-200">{todo.description}</p>
            </div>
          )}

          {/* Due Date */}
          {todo.dueDate && (
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              <strong>Due Date:</strong> {new Date(todo.dueDate).toLocaleDateString()}
            </div>
          )}

          {/* Files */}
          {todo.files && todo.files.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Files
              </h2>
              <div className="flex flex-wrap gap-3">
                {todo.files.map((file) => (
                  <a
                    key={file.id}
                    href={`/api/todos/files/${file.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-100 rounded-md text-sm hover:bg-blue-200 dark:hover:bg-blue-600 transition"
                  >
                    {file.filename}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TodoPage;
