"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, HardDrive } from "lucide-react";
import { adminGetStorage } from "@/api/admin";
import { card_className } from "./config";

interface MailboxStorage {
  id: string;
  email: string;
  name: string;
  quotaUsedMB: number;
  quotaMB: number;
  usedPercent: number;
}

function StorageBar({ percent }: { percent: number }) {
  const color =
    percent >= 85 ? "bg-red-500" : percent >= 60 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs w-10 text-right text-gray-500">{percent}%</span>
    </div>
  );
}

function fmtMB(mb: number) {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

export default function StorageTab() {
  const { domain } = useParams() as { domain: string };
  const [data, setData] = useState<MailboxStorage[]>([]);
  const [total, setTotal] = useState({ usedMB: 0, allocMB: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStorage = async () => {
    setLoading(true);
    try {
      const rs = await adminGetStorage(domain);
      if (rs?.success) {
        setData(rs.data || []);
        setTotal(rs.total || { usedMB: 0, allocMB: 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (domain) fetchStorage(); }, [domain]);

  const overallPercent = total.allocMB
    ? Math.round((total.usedMB / total.allocMB) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className={card_className}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HardDrive size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Domain Storage</h3>
          </div>
          <button
            onClick={fetchStorage}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-gray-400" : "text-gray-500"} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 mb-1">Used</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{fmtMB(total.usedMB)}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 mb-1">Allocated</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{fmtMB(total.allocMB)}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 mb-1">Utilization</p>
            <p className={`text-xl font-bold ${overallPercent >= 85 ? "text-red-600" : overallPercent >= 60 ? "text-yellow-600" : "text-green-600"}`}>
              {overallPercent}%
            </p>
          </div>
        </div>

        <StorageBar percent={overallPercent} />
      </div>

      {/* Per-mailbox breakdown */}
      <div className={card_className}>
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Per-Mailbox Breakdown</h3>

        {loading ? (
          <div className="flex justify-center py-8 text-gray-400">
            <RefreshCw size={20} className="animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-400">No mailboxes found.</p>
        ) : (
          <div className="space-y-3">
            {data
              .sort((a, b) => b.usedPercent - a.usedPercent)
              .map((m) => (
                <div key={m.id} className="flex items-center gap-4">
                  <div className="w-48 shrink-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{m.email}</p>
                    <p className="text-xs text-gray-400">{fmtMB(m.quotaUsedMB)} / {fmtMB(m.quotaMB)}</p>
                  </div>
                  <div className="flex-1">
                    <StorageBar percent={m.usedPercent} />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
