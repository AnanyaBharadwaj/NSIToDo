"use client";
import { useForm, SubmitHandler } from "react-hook-form";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { register, handleSubmit } = useForm<LoginFormData>();
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("AuthContext not found");
  const { login } = authContext;

  const onSubmit: SubmitHandler<LoginFormData> = (data) => {
    login(data.email, data.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
      <input {...register("email", { required: true })} placeholder="email" />
      <input {...register("password", { required: true })} type="password" placeholder="password" />
      <button type="submit">Login</button>
    </form>
  );
}
