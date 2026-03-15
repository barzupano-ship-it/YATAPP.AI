"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const user = authService.getStoredUser();
    router.replace(user ? "/dashboard" : "/login");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse text-slate-500">Loading...</div>
    </div>
  );
}
