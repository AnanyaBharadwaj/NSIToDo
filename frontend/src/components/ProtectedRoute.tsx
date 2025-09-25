"use client";
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useRouter } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const authContext = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!authContext?.user) {
      router.push("/auth/login");
    }
  }, [authContext?.user, router]);

  if (!authContext?.user) return <div>Loading...</div>;
  return <>{children}</>;
}
