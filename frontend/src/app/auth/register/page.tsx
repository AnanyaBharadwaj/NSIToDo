"use client";
import { useForm, SubmitHandler } from "react-hook-form";
import { useContext } from "react";
import api from "../../../lib/api";
import { AuthContext } from "../../../context/AuthContext";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("AuthContext not found");

  const { fetchMe } = authContext;
  const { register, handleSubmit } = useForm<RegisterFormData>();

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    try {
      const res = await api.post("/auth/register", data);
      if (res.status === 200) {
        await fetchMe();
        window.location.href = "/dashboard";
      } else {
        alert("Registration failed");
      }
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert("Registration failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
      <input {...register("name", { required: true })} placeholder="Name" />
      <input {...register("email", { required: true })} placeholder="Email" />
      <input
        {...register("password", { required: true })}
        type="password"
        placeholder="Password"
      />
      <button type="submit" className="bg-purple-500 text-white p-2 rounded">
        Register
      </button>
    </form>
  );
}
