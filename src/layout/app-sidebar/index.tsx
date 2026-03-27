"use client";
import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSidebar } from "../../context/SidebarContext";
import { MAIN_NAV, SUB_NAV } from "./config";
import { SidebarMenuItem } from "./sidebar-item";
import { HorizontaLDots } from "@/icons";

export const AppSidebar = () => {
  const { isExpanded, isHovered, isMobileOpen, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const isActive = useCallback(
    (path: string) => pathname === path,
    [pathname],
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0  bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${
          isExpanded || isHovered || isMobileOpen
            ? "w-[230px]"
            : "w-[90px]"
        }
        transition-all duration-300`}
      // onMouseEnter={() => !isExpanded && setIsHovered(true)}
      // onMouseLeave={() => setIsHovered(false)}
    >
      {/* LOGO */}
      <div
        className={`px-4 py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/" className="  flex items-center">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className=" object-contain h-[40px] w-[60px]"
                src="/logo.png"
                alt="Logo"
                width={150}
                height={40}
              />
              <span className="flex-1 font-bold text-black dark:text-white text-xl">VuMail </span>

            </>
          ) : (
            <Image
              className=" object-contain  h-[32px] w-[60px]"
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      {/* Navigation */}
      <nav className=" space-y-2 px-4">
        <h2
          className={`mb-2  text-xs uppercase flex leading-[20px] text-gray-400 ${
            !isExpanded && !isHovered
              ? "lg:justify-center"
              : "justify-start"
          }`}
        >
          {isExpanded || isHovered || isMobileOpen ? (
            "Primary"
          ) : (
            <HorizontaLDots />
          )}
        </h2>
        {MAIN_NAV.map((nav) => (
          <SidebarMenuItem
            key={nav.name}
            nav={nav}
            isActive={isActive}
            isExpanded={isExpanded}
            isHovered={isHovered}
            isMobileOpen={isMobileOpen}
          />
        ))}
        <h2
          className={`my-3 text-xs uppercase flex leading-[20px] text-gray-400 ${
            !isExpanded && !isHovered
              ? "lg:justify-center"
              : "justify-start"
          }`}
        >
          {isExpanded || isHovered || isMobileOpen ? (
            "Marketing"
          ) : (
            <HorizontaLDots />
          )}
        </h2>
        {SUB_NAV.map((nav) => (
          <SidebarMenuItem
            key={nav.name}
            nav={nav}
            isActive={isActive}
            isExpanded={isExpanded}
            isHovered={isHovered}
            isMobileOpen={isMobileOpen}
          />
        ))}
      </nav>
    </aside>
  );
};
