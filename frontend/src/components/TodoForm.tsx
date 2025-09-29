"use client";

import React, { useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { Todo } from "../types";

interface TodoFormInputs {
  title: string;
  description?: string;
  dueDate?: string;
  assignees: number[];
  files: FileList;
}

interface TodoFormProps {
  onSuccess: () => void;
  users: { id: number; name: string }[];
}

export const TodoForm: React.FC<TodoFormProps> = ({ onSuccess, users }) => {
  const { register, handleSubmit, setValue, watch } = useForm<TodoFormInputs>();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const files = watch("files");

  const mutation = useMutation<Todo, Error, TodoFormInputs>({
    mutationFn: async (data: TodoFormInputs) => {
      const formData = new FormData();
      formData.append("title", data.title);
      if (data.description) formData.append("description", data.description);
      if (data.dueDate) formData.append("dueDate", data.dueDate);
      formData.append("assignees", JSON.stringify(data.assignees));
      Array.from(data.files).forEach((file) => formData.append("files", file));

      const response = await api.post<Todo>("/todos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      onSuccess();
    },
  });

  const onSubmit: SubmitHandler<TodoFormInputs> = (data) => mutation.mutate(data);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      setValue("files", droppedFiles);
    }
    setDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="flex flex-col">
        <label className="font-medium mb-1">Title</label>
        <input
          {...register("title", { required: true })}
          placeholder="Enter title"
          className="border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col">
        <label className="font-medium mb-1">Description</label>
        <textarea
          {...register("description")}
          placeholder="Enter description"
          className="border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          rows={3}
        />
      </div>

      {/* Due Date */}
      <div className="flex flex-col">
        <label className="font-medium mb-1">Due Date</label>
        <input
          type="date"
          {...register("dueDate")}
          className="border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
        />
      </div>

      {/* Assignees */}
      <div className="flex flex-col">
        <label className="font-medium mb-1">Assignees</label>
        <select
          {...register("assignees", { required: true })}
          multiple
          className="border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Files Drag & Drop */}
      <div
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded p-6 transition-colors cursor-pointer ${
          dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        {files && files.length > 0 ? (
          Array.from(files).map((f, i) => (
            <p key={i} className="text-gray-800">
              {f.name}
            </p>
          ))
        ) : (
          <p className="text-gray-500">Drag & drop files here, or click to select</p>
        )}

        <input
          type="file"
          multiple
          {...register("files")}
          ref={fileInputRef}
          className="hidden"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={mutation.status === "pending"}
        className="w-full bg-blue-600 text-white p-4 rounded hover:bg-blue-700 transition text-lg font-medium"
      >
        {mutation.status === "pending" ? "Creating..." : "Create Todo"}
      </button>

      {mutation.isError && <p className="text-red-500">{mutation.error?.message}</p>}
    </form>
  );
};
