"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks, PlusCircle, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import { getWaitlists, createWaitlist, adminGetDomains } from "@/api/admin";

interface Waitlist {
  _id: string;
  name: string;
  domain: string;
  slug: string;
  doubleOptIn: boolean;
  active: boolean;
  createdAt: string;
  counts: { subscribed: number; pending: number; total: number };
}

export default function WaitlistsView() {
  const router = useRouter();
  const [waitlists, setWaitlists] = useState<Waitlist[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [domains, setDomains] = useState<{ domain: string; status: string }[]>([]);
  const [form, setForm] = useState({ name: "", domain: "", doubleOptIn: true });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const rs = await getWaitlists();
      if (rs?.success) setWaitlists(rs.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = async () => {
    setShowCreate(true);
    setError(null);
    const rs = await adminGetDomains({ status: "ACTIVE" });
    if (rs?.success) {
      const active = (rs.data || []).filter((d: any) => d.status === "ACTIVE");
      setDomains(active);
      setForm((f) => ({ ...f, domain: f.domain || active[0]?.domain || "" }));
    }
  };

  const submit = async () => {
    if (!form.name.trim() || !form.domain) {
      setError("Name and domain are required.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const rs = await createWaitlist({
        name: form.name.trim(),
        domain: form.domain,
        doubleOptIn: form.doubleOptIn,
      });
      if (rs?.success) {
        setShowCreate(false);
        router.push(`/waitlists/${rs.data._id}`);
      } else {
        setError(rs?.message || "Could not create waitlist.");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Waitlists</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Collect signups via a public API and email them when you&apos;re ready.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-gray-400" : "text-gray-600 dark:text-gray-300"} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            <PlusCircle size={16} /> New waitlist
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw size={22} className="mr-2 animate-spin" /> Loading…
          </div>
        ) : waitlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
            <ListChecks size={40} className="opacity-30" />
            <p className="text-sm">No waitlists yet. Create one to start collecting signups.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Confirmed</th>
                  <th className="px-4 py-3">Pending</th>
                  <th className="px-4 py-3">Opt-in</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {waitlists.map((w) => (
                  <tr
                    key={w._id}
                    className="cursor-pointer hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
                    onClick={() => router.push(`/waitlists/${w._id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{w.name}</td>
                    <td className="px-4 py-3">{w.domain}</td>
                    <td className="px-4 py-3">{w.counts?.subscribed ?? 0}</td>
                    <td className="px-4 py-3 text-yellow-600 dark:text-yellow-400">{w.counts?.pending ?? 0}</td>
                    <td className="px-4 py-3 text-xs">{w.doubleOptIn ? "Double" : "Single"}</td>
                    <td className="px-4 py-3">
                      <Badge color={w.active ? "success" : "light"}>{w.active ? "active" : "inactive"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">New waitlist</h2>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Beta access"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Domain</label>
            <select
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {domains.length === 0 && <option value="">No active domains</option>}
              {domains.map((d) => (
                <option key={d.domain} value={d.domain}>
                  {d.domain}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400">Confirmation emails are sent from this domain.</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={form.doubleOptIn}
              onChange={(e) => setForm({ ...form, doubleOptIn: e.target.checked })}
            />
            Require email confirmation (double opt-in)
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={creating}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
