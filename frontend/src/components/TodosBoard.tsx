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
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
  return data;
};

const SortableTodo: React.FC<{ todo: Todo }> = ({ todo }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: todo.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "12px",
    border: "2px solid #ccc",
    borderRadius: "8px",
    marginBottom: "12px",
    background: "#fff",
    color: "#000",
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
  const sensors = useSensors(useSensor(PointerSensor));

  const { data: todos = [], isLoading } = useQuery<BackendTodo[], Error>({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });

  const mutation = useMutation<Todo, Error, { id: number; status: BackendTodo["status"] }>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<Todo>(`/todos/${payload.id}/status`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  if (isLoading) return <div>Loading...</div>;

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

  const normalizedTodos: Todo[] = todos.map((t) => ({ ...t, status: normalizeStatus(t.status) }));

  const columns: Record<Todo["status"], Todo[]> = { todo: [], inprogress: [], done: [] };
  normalizedTodos.forEach((t) => columns[t.status].push(t));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const dragged = normalizedTodos.find((t) => t.id === Number(active.id));
    if (!dragged) return;

    const overElement = document.getElementById(over.id.toString());
    const parentColumn = overElement?.closest("[data-status]") as HTMLElement;
    if (!parentColumn?.dataset.status) return;

    const targetColumnStatus = parentColumn.dataset.status as Todo["status"];
    if (dragged.status !== targetColumnStatus) {
      const backendStatus = toBackendStatus(targetColumnStatus);
      mutation.mutate({ id: dragged.id, status: backendStatus });
    }
  };

  const columnColors: Record<Todo["status"], string> = {
    todo: "bg-yellow-100",
    inprogress: "bg-blue-100",
    done: "bg-green-100",
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="min-h-screen w-full bg-white-950 flex justify-center py-6">
        <div className="flex gap-6 w-full max-w-[90%]">
          {(["todo", "inprogress", "done"] as Todo["status"][]).map((status) => (
            <div
              key={status}
              data-status={status}
              className={`flex-1 rounded-lg p-6 shadow-inner flex flex-col ${columnColors[status]}`}
              style={{ border: "2px solid #555" }}
            >
              <h3 className="font-bold text-xl mb-4 text-gray-800 text-center tracking-wide">
                {status.toUpperCase()}
              </h3>
              <SortableContext
                items={columns[status].map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col flex-grow">
                  {columns[status].map((todo) => (
                    <SortableTodo key={todo.id} todo={todo} />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  );
};
