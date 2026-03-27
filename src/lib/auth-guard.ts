"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Hook to protect admin pages.
 * Redirects to /signin if no session is found after hydration.
 */
export function useAuthGuard() {
  const { token, user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/signin");
    }
  }, [loading, token, router]);

  return { token, user, loading };
}
