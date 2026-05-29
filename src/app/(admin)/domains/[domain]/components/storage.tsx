"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, HardDrive, Save } from "lucide-react";
import { adminGetStorage, adminUpdateDomain } from "@/api/admin";
import { card_className } from "./config";

interface MailboxStorage {
  id: string;
  email: string;
  name: string;
  quotaUsedMB: number;
  quotaMB: number;
  usedPercent: number;
}

interface DomainStorage {
  quotaMB: number;      // domain ceiling
  allocatedMB: number;  // allocated to mailboxes
  usedMB: number;       // actual bytes used
  messages: number;
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
  if (!mb || mb === 0) return "0 B";
  const bytes = mb * 1024 * 1024;
  if (bytes < 1024) return `${bytes.toFixed(0)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default function StorageTab() {
  const { domain } = useParams() as { domain: string };
  const [data, setData] = useState<MailboxStorage[]>([]);
  const [domainStats, setDomainStats] = useState<DomainStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const [quotaInput, setQuotaInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchStorage = async () => {
    setLoading(true);
    try {
      const rs = await adminGetStorage(domain);
      if (rs?.success) {
        setData(rs.data || []);
        if (rs.domain) {
          setDomainStats(rs.domain);
          setQuotaInput(String(rs.domain.quotaMB));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const saveQuota = async () => {
    const mb = parseInt(quotaInput);
    if (!mb || mb < 1) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const rs = await adminUpdateDomain(domain, { maxquota: mb });
      if (rs?.success) {
        setSaveMsg({ ok: true, text: "Quota updated in Mailcow." });
        fetchStorage();
      } else {
        setSaveMsg({ ok: false, text: rs?.error || "Update failed." });
      }
    } catch {
      setSaveMsg({ ok: false, text: "Request failed." });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { if (domain) fetchStorage(); }, [domain]);

  const allocPercent = domainStats?.quotaMB
    ? Math.round((domainStats.allocatedMB / domainStats.quotaMB) * 100)
    : 0;

  const usedPercent = domainStats?.allocatedMB
    ? Math.min(100, Math.round((domainStats.usedMB / domainStats.allocatedMB) * 100))
    : 0;

  return (
    <div className="space-y-4">
      {/* Domain-level summary */}
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 mb-1">Domain Quota</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">
              {domainStats ? fmtMB(domainStats.quotaMB) : "—"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 mb-1">Allocated to Mailboxes</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">
              {domainStats ? fmtMB(domainStats.allocatedMB) : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{allocPercent}% of quota</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 mb-1">Actually Used</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">
              {domainStats ? fmtMB(domainStats.usedMB) : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{usedPercent}% of allocated</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 mb-1">Messages</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">
              {domainStats?.messages?.toLocaleString() ?? "—"}
            </p>
          </div>
        </div>

        {domainStats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Allocated vs quota</span>
              <span>{fmtMB(domainStats.allocatedMB)} / {fmtMB(domainStats.quotaMB)}</span>
            </div>
            <StorageBar percent={allocPercent} />
          </div>
        )}
      </div>

      {/* Quota editor */}
      <div className={card_className}>
        <div className="flex items-center gap-2 mb-4">
          <Save size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-800 dark:text-white">Update Domain Quota</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Max Quota (MB)</label>
            <input
              type="number"
              min={1}
              value={quotaInput}
              onChange={(e) => setQuotaInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 10240"
            />
          </div>
          <button
            onClick={saveQuota}
            disabled={saving}
            className="mt-5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>
        {saveMsg && (
          <p className={`mt-2 text-xs ${saveMsg.ok ? "text-green-600" : "text-red-500"}`}>
            {saveMsg.text}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-400">
          This updates the domain ceiling in Mailcow. 1024 MB = 1 GB.
        </p>
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
