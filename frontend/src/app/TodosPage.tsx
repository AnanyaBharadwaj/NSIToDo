import React, { useEffect, useRef, useState } from "react";
import axios, { AxiosInstance } from "axios";
import api from "../lib/api";

interface User {
  id: number;
  name: string;
}

interface TodoFormProps {
  users: User[];
  onSuccess: () => void;
}

export const TodoForm: React.FC<TodoFormProps> = ({ users, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(""); // yyyy-mm-dd
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const handleToggleAssignee = (id: number) => {
    setSelectedAssignees((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setFiles((prev) => [...prev, ...Array.from(fileList)]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFileAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setSelectedAssignees([]);
    setFiles([]);
  };

  const formatDateDisplay = (isoDate: string) => {
    if (!isoDate) return "dd-mm-yyyy";
    const [y, m, d] = isoDate.split("-");
    return `${d}-${m}-${y}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const http: AxiosInstance = api || axios;

      if (files.length > 0) {
        const form = new FormData();
        form.append("title", title);
        form.append("description", description);
        form.append("dueDate", dueDate);
        selectedAssignees.forEach((id) => form.append("assigneeIds[]", String(id)));
        files.forEach((f) => form.append("files", f, f.name));

        await http.post("/todos", form);
      } else {
        const payload = { title, description, dueDate, assigneeIds: selectedAssignees };
        await http.post("/todos", payload);
      }

      onSuccess();
      resetForm();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error || "Error creating todo");
      } else if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Unknown error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-bold underline mb-1">Title</label>
        <input
          placeholder="Enter title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded w-full p-3 outline-none focus:ring-2 focus:ring-blue-200"
          required
        />
      </div>

      <div>
        <label className="block font-bold underline mb-1">Description</label>
        <textarea
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded w-full p-3 min-h-[100px] outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div>
        <label className="block font-bold underline mb-1">Due Date</label>
        <div className="flex items-center gap-2">
          <input
            ref={dateInputRef}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="border rounded p-2 flex-1 outline-none"
            aria-label="Due date"
          />

          <button
            type="button"
            onClick={() => {
              try {
                (dateInputRef.current as HTMLInputElement)?.showPicker?.();
              } catch (e) {
                /* ignore */
              }
              dateInputRef.current?.focus();
            }}
            className="border rounded px-3 py-2 hover:bg-gray-50"
            aria-label="Open calendar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">Format: DD-MM-YYYY — {formatDateDisplay(dueDate)}</p>
      </div>

      <div>
        <label className="block font-bold underline mb-1">Assignees</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {users.map((user) => (
            <label
              key={user.id}
              className="inline-flex items-center gap-2 border rounded-full px-3 py-1 text-sm whitespace-normal break-words bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedAssignees.includes(user.id)}
                onChange={() => handleToggleAssignee(user.id)}
                className="w-4 h-4"
              />
              <span className="font-semibold">{user.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-bold underline mb-1">Attachments</label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded p-4 text-center cursor-pointer"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="flex flex-col items-center gap-2">
            <p className="text-sm">Drag & drop files here, or click to select</p>
            <p className="text-xs text-gray-400">Allowed: any file type. Max size depends on your server.</p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-2 space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between border rounded p-2">
                <div className="truncate max-w-[70%] text-sm">{f.name}</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500">{Math.round(f.size / 1024)} KB</div>
                  <button type="button" onClick={() => removeFileAt(i)} className="text-sm underline">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full px-4 py-2 rounded text-white ${isSubmitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {isSubmitting ? "Creating..." : "Create Todo"}
      </button>
    </form>
  );
};

export const CreateTodoPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const http: AxiosInstance = api || axios;
        const response = await http.get<User[]>("/users");
        const data = response?.data ?? response;
        setUsers(data || []);
      } catch (err) {
        console.error("Error fetching users", err);
      }
    };

    fetchUsers();
  }, []);

  const handleSuccess = () => {
    alert("Todo created successfully!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-2xl">
        <div className="border border-blue-300 bg-white p-6 rounded-lg shadow mx-auto">
          <h1 className="text-2xl font-bold underline text-center mb-6">Create Todo</h1>
          <TodoForm users={users} onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
};

export default CreateTodoPage;