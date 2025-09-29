"use client";

import Link from "next/link";
import Image from "next/image";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { NotificationsBell } from "../components/NotificationsBells"; 

interface UserWithAvatar {
  id: number;
  email: string;
  name?: string | null;
  role: string;
  profilePicture?: string | null;
}

function toUserWithAvatar(user: unknown): UserWithAvatar | null {
  if (!user || typeof user !== "object") return null;
  const u = user as Record<string, unknown>;
  if (typeof u.id === "number" && typeof u.email === "string" && typeof u.role === "string") {
    return {
      id: u.id,
      email: u.email,
      name: typeof u.name === "string" ? u.name : undefined,
      role: u.role,
      profilePicture: typeof u.profilePicture === "string" ? u.profilePicture : undefined,
    };
  }
  return null;
}

export default function Navbar() {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("AuthContext not found");
  const { user, logout } = authContext;
  const typedUser = toUserWithAvatar(user);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="w-full bg-blue-700 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center py-4 px-6 relative">
        <div className="flex-1"></div>

        <Link
          href="/"
          className="text-2xl font-bold tracking-wide text-center flex-1 flex items-center justify-center"
        >
          <Image src="/file.svg" alt="Logo" width={40} height={40} />
          <span className="ml-2">ToDo</span>
        </Link>

        <div className="flex gap-4 flex-1 justify-end items-center">
          {!typedUser ? (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-lg border border-white hover:bg-white hover:text-indigo-600 transition"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 rounded-lg border border-white hover:bg-white hover:text-indigo-600 transition"
              >
                Register
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationsBell />

              {/* Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full hover:bg-blue-600 p-1 transition"
                >
                  {typedUser.profilePicture ? (
                    <Image
                      src={typedUser.profilePicture}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-blue-700 font-bold">
                      {typedUser.name ? typedUser.name[0] : typedUser.email[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:block">{typedUser.name || typedUser.email}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white text-gray-900 rounded shadow-lg z-50">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 hover:bg-gray-200"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-200"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
