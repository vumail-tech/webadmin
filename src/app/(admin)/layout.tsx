"use client";

import { useSidebar } from "@/context/SidebarContext";
import { AppSidebar } from "@/layout/app-sidebar";
import AppHeader from "@/layout/AppHeader";
import Backdrop from "@/layout/Backdrop";
import EmailVerificationBanner from "@/components/auth/EmailVerificationBanner";
import { storage } from "@/storage/helpers";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const session: any = storage.getItem("session");
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { hydrate, setAuth, setAuthLoading, token, loading } = useAuthStore();
  const router = useRouter();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[230px]"
    : "lg:ml-[90px]";

  useEffect(() => {
    if (session?.token && session?.user) {
      setAuth({ token: session.token, user: session.user });
    } else {
      setAuthLoading(false);
    }
    hydrate();
  }, []);

  // Redirect unauthenticated users to signin
  useEffect(() => {
    if (!loading && !token) {
      router.replace("/signin");
    }
  }, [loading, token, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <EmailVerificationBanner />
        <AppHeader />
        <div className="p-4 mx-auto md:p-6">{children}</div>
      </div>
    </div>
  );
}
