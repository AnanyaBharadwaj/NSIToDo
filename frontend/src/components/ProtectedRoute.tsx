"use client";

import { useContext, useEffect, ReactNode } from "react";
import { AuthContext } from "../context/AuthContext";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string; // optional role restriction
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const authContext = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!authContext?.user) {
      router.push("/auth/login");
    } 
    // If user does not have the required role, redirect to home
    else if (requiredRole && authContext.user.role !== requiredRole) {
      router.push("/"); 
    }
  }, [authContext?.user, requiredRole, router]);

  // While checking auth or role, show loading
  if (!authContext?.user) return <div>Loading...</div>;
  if (requiredRole && authContext.user.role !== requiredRole) return <div>Loading...</div>;

  return <>{children}</>;
}
