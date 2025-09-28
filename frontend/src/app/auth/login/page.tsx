"use client";
import { useForm, SubmitHandler } from "react-hook-form";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

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
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md px-12 py-16 space-y-10 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <h2 className="text-3xl font-semibold text-center text-gray-900 dark:text-gray-100">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input
              {...register("email", { required: true })}
              type="email"
              placeholder="Email address"
              className="w-full h-16 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
            <input
              {...register("password", { required: true })}
              type="password"
              placeholder="Password"
              className="w-full h-16 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
            <button
              type="submit"
              className="w-full h-16 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-lg font-medium"
            >
              Sign in
            </button>
          </form>

          <div className="text-center text-gray-600 dark:text-gray-300 text-base">
            New to the site?{" "}
            <a
              href="/auth/register"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create an account
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
