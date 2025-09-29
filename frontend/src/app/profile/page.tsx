"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { useContext, useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { AuthContext } from "@/context/AuthContext";

interface AvatarFormData {
  avatar: FileList;
}

interface UserWithAvatar {
  id: number;
  email: string;
  name?: string;
  role: string;
  profilePicture?: string | null;
}

// Type guard to safely convert user
function toUserWithAvatar(user: unknown): UserWithAvatar | null {
  if (!user || typeof user !== "object") return null;

  const u = user as Record<string, unknown>;
  if (
    typeof u.id === "number" &&
    typeof u.email === "string" &&
    typeof u.role === "string"
  ) {
    return {
      id: u.id,
      email: u.email,
      name: typeof u.name === "string" ? u.name : undefined,
      role: u.role,
      profilePicture:
        typeof u.profilePicture === "string" ? u.profilePicture : null,
    };
  }
  return null;
}

export default function ProfilePage() {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("AuthContext not found");
  const { user, fetchMe } = authContext;

  const typedUser = toUserWithAvatar(user);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    typedUser?.profilePicture ?? null
  );
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Update local avatar URL when context changes
    if (typedUser?.profilePicture) {
      setAvatarUrl(typedUser.profilePicture + `?t=${Date.now()}`);
    }
  }, [typedUser?.profilePicture]);

  const { register, handleSubmit, reset } = useForm<AvatarFormData>();

  const onSubmit: SubmitHandler<AvatarFormData> = async (data) => {
    if (!data.avatar || data.avatar.length === 0) return;
    setIsUploading(true);

    try {
      const fd = new FormData();
      fd.append("avatar", data.avatar[0]);
      await fetch("/api/users/me/avatar", { method: "POST", body: fd });
      await fetchMe(); // refresh context
      reset();
      setIsUploading(false);
    } catch (err: unknown) {
      setIsUploading(false);
      if (err instanceof Error) alert(err.message);
      else alert("Failed to upload avatar");
    }
  };

  if (!typedUser) return <div>Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md px-12 py-16 space-y-10 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <h2 className="text-3xl font-semibold text-center text-gray-900 dark:text-gray-100">
            My Profile
          </h2>

          <div className="flex flex-col items-center gap-4">
            {avatarUrl ? (
              <Image
                key={avatarUrl} // forces re-render
                src={avatarUrl}
                alt="Profile Picture"
                width={120}
                height={120}
                className="rounded-full object-cover transition-opacity duration-500"
                style={{ opacity: isUploading ? 0.5 : 1 }}
              />
            ) : (
              <div className="w-28 h-28 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300">
                No Image
              </div>
            )}
            <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {typedUser.name || typedUser.email}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Role: {typedUser.role}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input
              type="file"
              {...register("avatar", { required: true })}
              className="w-full h-16 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
            <button
              type="submit"
              disabled={isUploading}
              className="w-full h-16 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition text-lg font-medium"
            >
              {isUploading ? "Uploading..." : "Upload Avatar"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
