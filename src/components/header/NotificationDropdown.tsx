"use client";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notifications";

type Level = "info" | "success" | "warning" | "error";

interface Notif {
  _id: string;
  type: string;
  title: string;
  body?: string;
  level: Level;
  read: boolean;
  meta?: { domain?: string; link?: string };
  createdAt: string;
}

const LEVEL_DOT: Record<Level, string> = {
  info: "bg-blue-400",
  success: "bg-success-500",
  warning: "bg-orange-400",
  error: "bg-error-500",
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} d ago`;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  const load = useCallback(async () => {
    const res = await getNotifications({ limit: 20 });
    if (res?.success) {
      setItems(res.data);
      setUnread(res.unread ?? 0);
    }
  }, []);

  const refreshCount = useCallback(async () => {
    const res = await getUnreadCount();
    if (res?.success) setUnread(res.data.unread);
  }, []);

  // Initial unread count + live SSE subscription
  useEffect(() => {
    refreshCount();

    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return;

    const es = new EventSource(`${base}/api/notifications/stream`, {
      withCredentials: true,
    });
    esRef.current = es;

    es.addEventListener("notification", (e: MessageEvent) => {
      try {
        const notif: Notif = JSON.parse(e.data);
        setItems((prev) => [notif, ...prev].slice(0, 20));
        setUnread((u) => u + 1);
      } catch {
        /* ignore malformed */
      }
    });

    es.onerror = () => {
      // EventSource auto-reconnects; nothing to do.
    };

    return () => es.close();
  }, [refreshCount]);

  const toggleDropdown = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) load();
  };

  const closeDropdown = () => setIsOpen(false);

  const handleItemClick = async (n: Notif) => {
    if (!n.read) {
      setItems((prev) => prev.map((i) => (i._id === n._id ? { ...i, read: true } : i)));
      setUnread((u) => Math.max(0, u - 1));
      await markNotificationRead(n._id);
    }
    closeDropdown();
  };

  const markAll = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setUnread(0);
    await markAllNotificationsRead();
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {unread > 0 && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 flex">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
          </h5>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Mark all read
            </button>
          )}
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {items.length === 0 ? (
            <li className="py-10 text-center text-sm text-gray-400">No notifications yet.</li>
          ) : (
            items.map((n) => {
              const content = (
                <div
                  className={`flex gap-3 rounded-lg border-b border-gray-100 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                    n.read ? "" : "bg-blue-50/40 dark:bg-blue-900/10"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${LEVEL_DOT[n.level]}`}
                  />
                  <span className="block">
                    <span className="mb-1 block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {n.title}
                    </span>
                    {n.body && (
                      <span
                        className="mb-1 block text-theme-xs text-gray-500 dark:text-gray-400"
                        dangerouslySetInnerHTML={{ __html: n.body }}
                      />
                    )}
                    <span className="flex items-center gap-2 text-gray-400 text-theme-xs">
                      {n.meta?.domain && (
                        <>
                          <span>{n.meta.domain}</span>
                          <span className="w-1 h-1 bg-gray-400 rounded-full" />
                        </>
                      )}
                      <span>{timeAgo(n.createdAt)}</span>
                    </span>
                  </span>
                </div>
              );

              return (
                <li key={n._id}>
                  {n.meta?.link ? (
                    <Link href={n.meta.link} onClick={() => handleItemClick(n)}>
                      {content}
                    </Link>
                  ) : (
                    <button className="w-full text-left" onClick={() => handleItemClick(n)}>
                      {content}
                    </button>
                  )}
                </li>
              );
            })
          )}
        </ul>

        <Link
          href="/billing"
          onClick={closeDropdown}
          className="mt-3 block rounded-lg border border-gray-200 bg-white p-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
        >
          View billing
        </Link>
      </Dropdown>
    </div>
  );
}
