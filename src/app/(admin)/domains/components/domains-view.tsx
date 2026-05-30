"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import AddDomainModal from "./add-domain";
import { adminGetDomains, adminDeleteDomain } from "@/api/admin";
import { Globe, Trash2, Pencil, RefreshCw, PlusCircle } from "lucide-react";
import EditDomainModal from "./edit-domain";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Domain {
  _id: string;
  domain: string;
  status: "PENDING_DNS" | "ACTIVE" | "SUSPENDED";
  mailboxCount: number;
  createdAt: string;
  subscription?: {
    status: "trialing" | "active" | "past_due" | "suspended" | "canceled";
    planKey?: string;
    planName?: string | null;
    trialEndsAt?: string;
    currentPeriodEnd?: string;
  } | null;
  metrics?: {
    sent: number;
    received: number;
    spam: number;
    deferred: number;
    rejected: number;
    healthScore: number;
    healthLabel: string;
    monthly?: { year: number; month: number; sent: number; received: number }[];
  } | null;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400",
  PENDING_DNS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400",
};

const subStatusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  trialing: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  past_due: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
  suspended: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  canceled: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
};

export default function DomainsView() {
  const { push } = useRouter();
  const { isOpen, openModal, closeModal } = useModal();
  const [editDomain, setEditDomain] = useState<Domain | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const fetchDomains = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (filterStatus !== "All") params.status = filterStatus;
      const rs = await adminGetDomains(params);
      if (rs?.success) setDomains(rs.data || []);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => { fetchDomains(); }, [fetchDomains]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteDomain(deleteTarget.domain);
      setDeleteTarget(null);
      fetchDomains();
    } finally {
      setDeleting(false);
    }
  };

  const toggleRow = (id: string) =>
    setSelectedRows((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);

  const filteredDomains = domains.filter((d) => {
    const matchStatus = filterStatus === "All" || d.status === filterStatus;
    const matchSearch = d.domain.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h2 className="font-semibold text-gray-800 text-lg dark:text-white/90">
            {loading ? "Loading..." : `${domains.length} domain${domains.length !== 1 ? "s" : ""}`}
          </h2>
          <div className="flex gap-3 flex-1 justify-end flex-wrap">
            <input
              type="text"
              placeholder="Search domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <div className="border border-gray-300 dark:border-gray-700 px-3 py-2 rounded-lg">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="cursor-pointer w-[130px] outline-none text-sm dark:bg-transparent dark:text-gray-200"
              >
                <option value="All">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING_DNS">Pending DNS</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            <button
              onClick={fetchDomains}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin text-gray-400" : "text-gray-600 dark:text-gray-300"} />
            </button>
            <button
              onClick={openModal}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              <PlusCircle size={16} /> Add Domain
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw size={24} className="animate-spin mr-2" /> Loading domains…
          </div>
        ) : filteredDomains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <Globe size={40} className="opacity-30" />
            <p className="text-sm">No domains found. Add your first domain to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === filteredDomains.length && filteredDomains.length > 0}
                      onChange={() =>
                        setSelectedRows(
                          selectedRows.length === filteredDomains.length
                            ? []
                            : filteredDomains.map((d) => d._id)
                        )
                      }
                    />
                  </th>
                  <th className="px-3 py-3">Domain</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Plan</th>
                  <th className="px-3 py-3">Mailboxes</th>
                  <th className="px-3 py-3">Sent</th>
                  <th className="px-3 py-3">Received</th>
                  <th className="px-3 py-3">Deferred</th>
                  <th className="px-3 py-3">Spam</th>
                  <th className="px-3 py-3">Health</th>
                  <th className="px-3 py-3">Created</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredDomains.map((domain) => (
                  <tr
                    key={domain._id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => push(`/domains/${domain.domain}`)}
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(domain._id)}
                        onChange={() => toggleRow(domain._id)}
                      />
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-800 dark:text-white/90">
                      {domain.domain}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[domain.status] || ""}`}>
                        {domain.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {domain.subscription ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {domain.subscription.planName ?? "—"}
                          </span>
                          <span
                            className={`w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              subStatusColors[domain.subscription.status] || ""
                            }`}
                          >
                            {domain.subscription.status.replace("_", " ")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No plan</span>
                      )}
                    </td>
                    <td className="px-3 py-3">{domain.mailboxCount ?? 0}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{(domain.metrics?.sent ?? 0).toLocaleString()}</span>
                        {(domain.metrics?.monthly?.length ?? 0) > 1 && (
                          <ReactApexChart
                            options={{
                              chart: { sparkline: { enabled: true } },
                              stroke: { curve: "smooth", width: 1.5 },
                              colors: ["#465FFF"],
                              tooltip: { enabled: false },
                            }}
                            series={[{ data: domain.metrics!.monthly!.map((m) => m.sent) }]}
                            type="line"
                            height={28}
                            width={60}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{(domain.metrics?.received ?? 0).toLocaleString()}</span>
                        {(domain.metrics?.monthly?.length ?? 0) > 1 && (
                          <ReactApexChart
                            options={{
                              chart: { sparkline: { enabled: true } },
                              stroke: { curve: "smooth", width: 1.5 },
                              colors: ["#10b981"],
                              tooltip: { enabled: false },
                            }}
                            series={[{ data: domain.metrics!.monthly!.map((m) => m.received) }]}
                            type="line"
                            height={28}
                            width={60}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-yellow-600 dark:text-yellow-400">
                      {(domain.metrics?.deferred ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">{(domain.metrics?.spam ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`text-xs font-semibold ${
                          (domain.metrics?.healthScore ?? 100) >= 80
                            ? "text-green-600"
                            : (domain.metrics?.healthScore ?? 100) >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {domain.metrics?.healthScore ?? 100}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-400 text-xs">
                      {new Date(domain.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditDomain(domain)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(domain)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Domain Modal */}
      <AddDomainModal isOpen={isOpen} onClose={() => { closeModal(); fetchDomains(); }} />

      {/* Edit Domain Modal */}
      {editDomain && (
        <EditDomainModal
          isOpen={!!editDomain}
          domain={editDomain}
          onClose={() => { setEditDomain(null); fetchDomains(); }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Delete Domain</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete{" "}
            <span className="font-medium text-red-600">{deleteTarget?.domain}</span>? This will
            permanently remove all mailboxes, aliases, and emails. This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
