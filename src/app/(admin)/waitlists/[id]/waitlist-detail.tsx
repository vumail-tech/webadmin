"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft, Copy, Check, RefreshCw, Plus, Trash2, Download, Save,
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import {
  getWaitlist, updateWaitlist, regenerateWaitlistKey, getWaitlistEntries,
} from "@/api/admin";
import Instance from "@/api/axios-interceptor";

const card = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]";
const input =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api`;

interface Field {
  key: string;
  label: string;
  type: "text" | "email" | "number" | "select";
  required: boolean;
  options?: string[];
}

const entryStatusColor: Record<string, string> = {
  subscribed: "success",
  pending: "warning",
  unsubscribed: "light",
  bounced: "error",
};

export default function WaitlistDetail() {
  const { id } = useParams() as { id: string };

  const [wl, setWl] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // editable config
  const [fields, setFields] = useState<Field[]>([]);
  const [doubleOptIn, setDoubleOptIn] = useState(true);
  const [active, setActive] = useState(true);
  const [confirmation, setConfirmation] = useState({ subject: "", fromLocalPart: "no-reply", redirectUrl: "" });
  const [allowedOrigins, setAllowedOrigins] = useState("");

  // entries
  const [entries, setEntries] = useState<any[]>([]);
  const [entryStatus, setEntryStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [entriesLoading, setEntriesLoading] = useState(false);

  const loadWaitlist = useCallback(async () => {
    setLoading(true);
    try {
      const rs = await getWaitlist(id);
      if (rs?.success) {
        const w = rs.data;
        setWl(w);
        setFields(w.fields ?? []);
        setDoubleOptIn(w.doubleOptIn !== false);
        setActive(w.active !== false);
        setConfirmation({
          subject: w.confirmation?.subject ?? "Please confirm your signup",
          fromLocalPart: w.confirmation?.fromLocalPart ?? "no-reply",
          redirectUrl: w.confirmation?.redirectUrl ?? "",
        });
        setAllowedOrigins((w.allowedOrigins ?? []).join("\n"));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadEntries = useCallback(async () => {
    setEntriesLoading(true);
    try {
      const rs = await getWaitlistEntries(id, {
        status: entryStatus,
        search: search || undefined,
        limit: 50,
      });
      if (rs?.success) setEntries(rs.data || []);
    } finally {
      setEntriesLoading(false);
    }
  }, [id, entryStatus, search]);

  useEffect(() => {
    loadWaitlist();
  }, [loadWaitlist]);
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateWaitlist(id, {
        fields,
        doubleOptIn,
        active,
        confirmation,
        allowedOrigins: allowedOrigins.split("\n").map((s) => s.trim()).filter(Boolean),
      });
      await loadWaitlist();
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async () => {
    if (!confirm("Regenerate the public key? The old key stops working immediately.")) return;
    const rs = await regenerateWaitlistKey(id);
    if (rs?.success) setWl((w: any) => ({ ...w, publicKey: rs.data.publicKey }));
  };

  const exportCsv = async () => {
    const res = await Instance.get(`/admin/waitlists/${id}/export`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${wl?.slug ?? "waitlist"}-entries.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !wl) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <RefreshCw size={22} className="mr-2 animate-spin" /> Loading…
      </div>
    );
  }

  const endpoint = `${API_BASE}/waitlist/${wl.publicKey}/submit`;
  const snippet = `await fetch("${endpoint}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com"${fields.length ? ",\n    " + fields.map((f) => `${f.key}: "..."`).join(",\n    ") : ""}
  }),
});`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/waitlists" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{wl.name}</h1>
          <Badge color={active ? "success" : "light"}>{active ? "active" : "inactive"}</Badge>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Save size={15} /> {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {/* Integration */}
      <div className={card}>
        <h2 className="mb-3 font-semibold text-gray-800 dark:text-white">Integration</h2>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Submit endpoint</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-gray-100 px-2 py-1.5 font-mono text-xs dark:bg-gray-800">
                POST {endpoint}
              </code>
              <button onClick={() => copy(endpoint, "endpoint")} className="rounded-md border border-gray-200 p-1.5 dark:border-gray-700">
                {copied === "endpoint" ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              The key in the URL is publishable (safe to use in client-side code).{" "}
              <button onClick={regenerate} className="text-blue-600 hover:underline">Regenerate key</button>
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Example</p>
            <div className="relative">
              <button
                onClick={() => copy(snippet, "snippet")}
                className="absolute right-2 top-2 rounded-md bg-gray-800 p-1.5 text-gray-300 hover:bg-gray-700"
              >
                {copied === "snippet" ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              </button>
              <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-green-300">
                <code>{snippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className={card}>
        <h2 className="mb-4 font-semibold text-gray-800 dark:text-white">Settings</h2>
        <div className="space-y-5">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input type="checkbox" checked={doubleOptIn} onChange={(e) => setDoubleOptIn(e.target.checked)} />
              Double opt-in (email confirmation)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Active (accepting signups)
            </label>
          </div>

          {/* Custom fields */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Custom fields</p>
              <button
                onClick={() => setFields([...fields, { key: "", label: "", type: "text", required: false }])}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Plus size={13} /> Add field
              </button>
            </div>
            {fields.length === 0 ? (
              <p className="text-xs text-gray-400">Only email is collected. Add fields to capture more.</p>
            ) : (
              <div className="space-y-2">
                {fields.map((f, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <input
                      placeholder="key (e.g. company)"
                      value={f.key}
                      onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))}
                      className={`${input} max-w-[160px]`}
                    />
                    <input
                      placeholder="Label"
                      value={f.label}
                      onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                      className={`${input} max-w-[180px]`}
                    />
                    <select
                      value={f.type}
                      onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, type: e.target.value as Field["type"] } : x)))}
                      className={`${input} max-w-[120px]`}
                    >
                      <option value="text">text</option>
                      <option value="email">email</option>
                      <option value="number">number</option>
                      <option value="select">select</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)))}
                      />
                      required
                    </label>
                    <button
                      onClick={() => setFields(fields.filter((_, j) => j !== i))}
                      className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirmation */}
          {doubleOptIn && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">From (local part)</label>
                <input
                  value={confirmation.fromLocalPart}
                  onChange={(e) => setConfirmation({ ...confirmation, fromLocalPart: e.target.value })}
                  className={input}
                  placeholder="no-reply"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Confirmation subject</label>
                <input
                  value={confirmation.subject}
                  onChange={(e) => setConfirmation({ ...confirmation, subject: e.target.value })}
                  className={input}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs text-gray-500">Redirect URL after confirming (optional)</label>
                <input
                  value={confirmation.redirectUrl}
                  onChange={(e) => setConfirmation({ ...confirmation, redirectUrl: e.target.value })}
                  className={input}
                  placeholder="https://yoursite.com/thanks"
                />
              </div>
            </div>
          )}

          {/* Allowed origins */}
          <div>
            <label className="mb-1 block text-xs text-gray-500">
              Allowed origins (one per line, leave empty to allow any)
            </label>
            <textarea
              value={allowedOrigins}
              onChange={(e) => setAllowedOrigins(e.target.value)}
              rows={2}
              className={input}
              placeholder="https://yoursite.com"
            />
          </div>
        </div>
      </div>

      {/* Entries */}
      <div className={card}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-800 dark:text-white">
            Signups <span className="text-gray-400">({wl.counts?.total ?? entries.length})</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              placeholder="Search email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${input} max-w-[180px]`}
            />
            <select value={entryStatus} onChange={(e) => setEntryStatus(e.target.value)} className={`${input} max-w-[140px]`}>
              <option value="all">All</option>
              <option value="subscribed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {entriesLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <RefreshCw size={18} className="mr-2 animate-spin" /> Loading…
          </div>
        ) : entries.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No signups yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="border-b text-xs uppercase tracking-wider text-gray-400 dark:border-gray-700">
                <tr>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {entries.map((e) => (
                  <tr key={e._id}>
                    <td className="px-2 py-2 font-mono text-xs">{e.email}</td>
                    <td className="px-2 py-2">{e.name ?? "—"}</td>
                    <td className="px-2 py-2">
                      <Badge color={(entryStatusColor[e.status] as any) ?? "light"}>{e.status}</Badge>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-400">
                      {new Date(e.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
