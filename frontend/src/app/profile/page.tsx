"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { useContext } from "react";
import Image from "next/image";
import api from "../../lib/api";
import { AuthContext } from "../../context/AuthContext";

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

  const { register, handleSubmit } = useForm<AvatarFormData>();

  const onSubmit: SubmitHandler<AvatarFormData> = async (data) => {
    try {
      const fd = new FormData();
      fd.append("avatar", data.avatar[0]);
      await api.post("/users/me/avatar", fd);
      await fetchMe();
      alert("Avatar uploaded successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert("Failed to upload avatar");
    }
  };

  if (!typedUser) return <div>Loading...</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Profile
      </h2>

      <div className="flex flex-col items-center gap-4 mb-6">
        {typedUser.profilePicture ? (
          <Image
            src={typedUser.profilePicture}
            alt="Profile Picture"
            width={120}
            height={120}
            className="rounded-full object-cover"
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

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <input
          type="file"
          {...register("avatar", { required: true })}
          className="p-2 border rounded dark:bg-gray-700 dark:text-gray-100"
        />
        <button
          type="submit"
          className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600 transition"
        >
          Upload Avatar
        </button>
      </form>
    </div>
  );
}
