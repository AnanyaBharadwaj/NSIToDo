
// frontend/pages/files.tsx (Pages Router) or app/files/page.tsx
"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

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
    <div>
      <h1>Files</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Filename</th>
            <th>Todo</th>
            <th>Uploader</th>
            <th>Uploaded At</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.id}>
              <td>{f.filename}</td>
              <td>{f.todo?.title || "-"}</td>
              <td>{f.uploader?.name || f.uploader?.email || "-"}</td>
              <td>{new Date(f.createdAt).toLocaleString()}</td>
              <td>
                <a
                  href={`${
                    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
                  }/api/todos/files/${f.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FilesPage;
