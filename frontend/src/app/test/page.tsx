"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import api from "@/lib/api";

interface LoginFormInputs {
  email: string;
  password: string;
}

export default function AuthTestPage() {
  const { register, handleSubmit } = useForm<LoginFormInputs>();
  const [loginResponse, setLoginResponse] = useState<string>("");
  const [todosResponse, setTodosResponse] = useState<string>("");

  const onLogin: SubmitHandler<LoginFormInputs> = async (data) => {
    try {
      const res = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      // Save token
      const token: string = res.data.token;
      localStorage.setItem("token", token);
      setLoginResponse(`Login successful. Token saved: ${token}`);

      console.log("Login response:", res.data);
    } catch (err: unknown) {
      // Proper type narrowing
      if (err instanceof Error) {
        setLoginResponse(`Login failed: ${err.message}`);
        console.error(err);
      } else {
        setLoginResponse(`Login failed: ${JSON.stringify(err)}`);
        console.error(err);
      }
    }
  };

  const fetchTodos = async () => {
    try {
      const res = await api.get("/todos", { params: { filter: "myTodos" } });
      setTodosResponse(`Fetched todos: ${JSON.stringify(res.data)}`);
      console.log("Todos response:", res.data);
    } catch (err: unknown) {
      // Proper type narrowing
      if (err instanceof Error) {
        setTodosResponse(`Fetch todos failed: ${err.message}`);
        console.error(err);
      } else {
        setTodosResponse(`Fetch todos failed: ${JSON.stringify(err)}`);
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Auth + API Test</h1>

      {/* Login Form */}
      <form
        onSubmit={handleSubmit(onLogin)}
        className="flex flex-col w-full max-w-md bg-white p-6 rounded-lg shadow-md space-y-4"
      >
        <input
          {...register("email", { required: true })}
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
        />
        <input
          {...register("password", { required: true })}
          type="password"
          placeholder="Password"
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Login
        </button>
      </form>

      {/* Display login status */}
      {loginResponse && <p className="mt-4 text-blue-700">{loginResponse}</p>}

      {/* Fetch Todos Button */}
      <button
        onClick={fetchTodos}
        className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        Fetch My Todos
      </button>

      {/* Display todos response */}
      {todosResponse && <pre className="mt-4 bg-gray-200 p-4 rounded w-full max-w-md">{todosResponse}</pre>}
    </div>
  );
}
