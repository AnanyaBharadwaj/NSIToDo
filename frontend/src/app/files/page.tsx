// frontend/app/files/page.tsx (or pages/files.tsx)
"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";

export interface FileRecord {
  id: number;
  filename: string;
  createdAt: string;
  todo?: {
    id: number;
    title: string;
  } | null;
  uploader?: {
    id: number;
    name?: string | null;
    email?: string | null;
  } | null;
}

const fetchFiles = async (): Promise<FileRecord[]> => {
  const { data } = await api.get<FileRecord[]>("/files");
  return data;
};

const FilesPage: React.FC = () => {
  const { data: files = [], isLoading, isError, error } = useQuery<FileRecord[], Error>({
    queryKey: ["files"],
    queryFn: fetchFiles,
  });

  if (isLoading) return <div>Loading files...</div>;
  if (isError) return <div style={{ color: "red" }}>Error: {error.message}</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-black flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Spacer below navbar */}
      <div className="h-12" />

      <div className="px-6">
        <h1 className="text-2xl font-bold mb-6">Files</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-4 py-2">Filename</th>
                <th className="border px-4 py-2">Todo</th>
                <th className="border px-4 py-2">Uploader</th>
                <th className="border px-4 py-2">Uploaded At</th>
                <th className="border px-4 py-2">Download</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id} className="hover:bg-gray-100">
                  <td className="border px-4 py-2">{f.filename}</td>
                  <td className="border px-4 py-2">{f.todo?.title || "-"}</td>
                  <td className="border px-4 py-2">{f.uploader?.name || f.uploader?.email || "-"}</td>
                  <td className="border px-4 py-2">{new Date(f.createdAt).toLocaleString()}</td>
                  <td className="border px-4 py-2">
                    <a
                      href={`${
                        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
                      }/api/todos/files/${f.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FilesPage;
