"use client";
import { useForm, SubmitHandler } from "react-hook-form";
import { useContext } from "react";
import api from "../../lib/api";
import { AuthContext } from "../../context/AuthContext";

interface AvatarFormData {
  avatar: FileList;
}

export default function ProfilePage() {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("AuthContext not found");
  const { user, fetchMe } = authContext;

  const { register, handleSubmit } = useForm<AvatarFormData>();

  const onSubmit: SubmitHandler<AvatarFormData> = async (data) => {
    try {
      const fd = new FormData();
      fd.append("avatar", data.avatar[0]);
      await api.post("/users/me/avatar", fd);
      await fetchMe();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert("Failed to upload avatar");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
      <div>Logged in as: {user?.email}</div>
      <input type="file" {...register("avatar", { required: true })} />
      <button type="submit" className="bg-purple-500 text-white p-2 rounded">
        Upload Avatar
      </button>
    </form>
  );
}
