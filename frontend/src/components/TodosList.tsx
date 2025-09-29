"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Todo } from "../types";
import api from "../lib/api";
import Link from "next/link";

interface TodosListProps {
  filter: "myTodos" | "assignedTodos";
}

export const TodosList: React.FC<TodosListProps> = ({ filter }) => {
  const { data, isLoading, error } = useQuery<Todo[], Error>({
    queryKey: ["todos", filter],
    queryFn: async () => {
      if (filter === "myTodos") {
        const response = await api.get<Todo[]>("/todos/my");
        return response.data;
      } else {
        const response = await api.get<Todo[]>("/todos/assigned");
        return response.data;
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  const todos: Todo[] = data ?? [];

  return (
    <div className="space-y-4">
      {todos.length === 0 && <p className="text-gray-500">No todos yet.</p>}

      {todos.map((todo, index) => (
        <div
          key={todo.id}
          className="flex flex-col gap-2 p-4 border border-gray-300 rounded-lg hover:shadow-lg transition"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg text-black">
              {index + 1}.{" "}
              <Link
                href={`/todos/${todo.id}`}
                className="hover:underline text-black"
              >
                {todo.title}
              </Link>
            </h3>

            <TodoStatusBadge todoId={todo.id} />
          </div>

          {todo.description && (
            <p className="text-gray-700 text-sm">{todo.description}</p>
          )}

          {todo.dueDate && (
            <p className="text-gray-500 text-xs">
              Due: {new Date(todo.dueDate).toLocaleDateString()}
            </p>
          )}

          {todo.files?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {todo.files.map((file) => (
                <a
                  key={file.id}
                  href={`/api/files/${file.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm hover:text-blue-800"
                >
                  {file.filename}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Status badge component
interface TodoStatusResponse {
  status: string;
}

const TodoStatusBadge: React.FC<{ todoId: number }> = ({ todoId }) => {
  const { data: status, isLoading } = useQuery<string, Error>({
    queryKey: ["todo-status", todoId],
    queryFn: async () => {
      const response = await api.get<TodoStatusResponse>(`/todos/${todoId}/status`);
      return response.data.status;
    },
    staleTime: 5000,
  });

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
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ${
        status ? getBadgeColor(status) : "bg-gray-100 text-gray-800"
      }`}
    >
      {isLoading ? "Loading..." : status ?? "N/A"}
    </span>
  );
};

export default TodosList;
