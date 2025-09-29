"use client";

import React from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export interface Todo {
  id: number;
  title: string;
  description?: string;
  order?: number;
  status: "todo" | "inprogress" | "done";
}

interface BackendTodo {
  id: number;
  title: string;
  description?: string;
  order?: number;
  status: "TODO" | "IN_PROGRESS" | "DONE";
}

const fetchTodos = async (): Promise<BackendTodo[]> => {
  const { data } = await api.get("/todos/status");
  console.log("Fetched todos from backend:", data);
  return data;
};

const SortableTodo: React.FC<{ todo: Todo }> = ({ todo }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: todo.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 8,
    marginBottom: 8,
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <strong>{todo.title}</strong>
      {todo.description && <div style={{ fontSize: 12 }}>{todo.description}</div>}
    </div>
  );
};

export const TodosBoard: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: todos = [], isLoading } = useQuery<BackendTodo[], Error>({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });

  const mutation = useMutation<
    Todo,
    Error,
    { id: number; status: BackendTodo["status"] }
  >({
    mutationFn: async (payload) => {
      console.log("Mutating todo:", payload);
      const { data } = await api.patch<Todo>(`/todos/${payload.id}/status`, payload);
      console.log("Mutation response:", data);
      return data;
    },
    onSuccess: () => {
      console.log("Mutation success, invalidating todos query");
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const sensors = useSensors(useSensor(PointerSensor));

  if (isLoading) return <div>Loading...</div>;

  // Normalize backend status to frontend status
  const normalizeStatus = (status: BackendTodo["status"]): Todo["status"] => {
    switch (status) {
      case "TODO":
        return "todo";
      case "IN_PROGRESS":
        return "inprogress";
      case "DONE":
        return "done";
      default:
        return "todo";
    }
  };

  const normalizedTodos: Todo[] = todos.map((t) => ({
    ...t,
    status: normalizeStatus(t.status),
  }));

  // Map frontend status back to backend for mutation
  const toBackendStatus = (status: Todo["status"]): BackendTodo["status"] => {
    switch (status) {
      case "todo":
        return "TODO";
      case "inprogress":
        return "IN_PROGRESS";
      case "done":
        return "DONE";
    }
  };

  // Group todos by status
  const columns: Record<Todo["status"], Todo[]> = {
    todo: [],
    inprogress: [],
    done: [],
  };
  normalizedTodos.forEach((t) => columns[t.status].push(t));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const dragged = normalizedTodos.find((t) => t.id === Number(active.id));
    const target = normalizedTodos.find((t) => t.id === Number(over.id));
    if (!dragged || !target) return;

    console.log("Drag ended:", { dragged, target });

    if (dragged.status !== target.status) {
      const backendStatus = toBackendStatus(target.status);
      console.log(`Updating todo ${dragged.id} to status ${backendStatus}`);
      mutation.mutate({ id: dragged.id, status: backendStatus });
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div
        className="flex gap-4 w-full p-4"
        style={{ backgroundColor: "#0B3D91", minHeight: "calc(100vh - 64px)" }} // dark blue background, full height minus navbar
      >
        {(["todo", "inprogress", "done"] as Todo["status"][]).map((status) => (
          <div
            key={status}
            className="flex-1 p-4 rounded flex flex-col"
            style={{
              backgroundColor: "#0B3D91",
              boxShadow: "inset 0 0 5px rgba(0,0,0,0.5)",
              minHeight: "100%", // ensures entire column height
            }}
          >
            <h3 className="font-bold text-lg mb-4 text-white">{status.toUpperCase()}</h3>
            <SortableContext items={columns[status].map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div style={{ flexGrow: 1 }}>
                {columns[status].map((todo) => (
                  <SortableTodo key={todo.id} todo={todo} />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
    </DndContext>
  );
};
