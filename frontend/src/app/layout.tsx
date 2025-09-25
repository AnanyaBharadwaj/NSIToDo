// src/app/layout.tsx
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import React from "react";
import ClientProviders from "../app/ClientProviders";

export const metadata = {
  title: "NSI ToDo",
  description: "Frontend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ClientProviders>{children}</ClientProviders>
        </AuthProvider>
      </body>
    </html>
  );
}
