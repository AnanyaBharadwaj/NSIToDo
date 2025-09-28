"use client";
import { useForm, SubmitHandler } from "react-hook-form";
import { useContext } from "react";
import api from "../../../lib/api";
import { AuthContext } from "../../../context/AuthContext";
import Navbar from "@/components/Navbar";

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
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md px-12 py-16 space-y-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg"
        >
          <h2 className="text-3xl font-semibold text-center text-gray-900 dark:text-gray-100">
            Create your account
          </h2>

          <input
            {...register("name", { required: true })}
            placeholder="Name"
            className="w-full h-14 px-4 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
          />

          <input
            {...register("email", { required: true })}
            placeholder="Email"
            type="email"
            className="w-full h-14 px-4 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
          />

          <input
            {...register("password", { required: true })}
            type="password"
            placeholder="Password"
            className="w-full h-14 px-4 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
          />

          <button
            type="submit"
            className="w-full h-14 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition text-lg font-medium"
          >
            Register
          </button>

          <div className="text-center text-gray-600 dark:text-gray-300 text-base">
            Already have an account?{" "}
            <a
              href="/auth/login"
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              Sign in
            </a>
          </div>
        </form>
      </div>
    </>
  );
}
