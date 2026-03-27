"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { cn } from "@/lib/utils";
import { card_className } from "./config";
import { useModal } from "@/hooks/useModal";
import AddUserModal from "./add-user";
import { Plus, MoreHorizontal, RefreshCw, Pencil, Trash2, KeyRound } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminGetMailboxes, adminDeleteMailbox, adminUpdateMailbox } from "@/api/admin";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Mailbox = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  phone: string;
  aliases?: number;
  quotaUsedMB: number;
  quotaMB: number;
  usedPercent: number;
  sentStats: number[];
};

export function UsersTable() {
  const { openModal, isOpen, closeModal } = useModal();
  const domain = useParams().domain as string;

  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Modals
  const [editTarget, setEditTarget] = useState<Mailbox | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mailbox | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editQuota, setEditQuota] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);

  const fetchMailboxes = async () => {
    setLoading(true);
    try {
      const rs = await adminGetMailboxes(domain);
      if (rs?.success) setMailboxes(rs.data || []);
      else if (Array.isArray(rs)) setMailboxes(rs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (domain) fetchMailboxes(); }, [domain]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (openMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenu]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteMailbox(domain, deleteTarget.id);
      setDeleteTarget(null);
      fetchMailboxes();
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      await adminUpdateMailbox(domain, editTarget.id, {
        active: editActive,
        ...(editQuota ? { quotaMB: parseInt(editQuota) } : {}),
      });
      setEditTarget(null);
      fetchMailboxes();
    } finally {
      setEditSaving(false);
    }
  };

  const openEdit = (mb: Mailbox) => {
    setEditTarget(mb);
    setEditQuota(String(mb.quotaMB));
    setEditActive(mb.active);
    setOpenMenu(null);
  };

  const sparklineOptions: ApexOptions = {
    chart: { type: "area", sparkline: { enabled: true } },
    stroke: { curve: "smooth", width: 2 },
    fill: { opacity: 0.3 },
    tooltip: { enabled: false },
    colors: ["#465FFF"],
  };

  const storageColor = (pct: number) =>
    pct >= 85 ? "stroke-red-500" : pct >= 60 ? "stroke-yellow-500" : "stroke-green-500";

  const row_className = "px-4 py-3 text-gray-700 dark:text-gray-300 text-sm";

  return (
    <>
      <div className={cn("overflow-x-auto", card_className)}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {loading ? "Loading…" : `${mailboxes.length} mailbox${mailboxes.length !== 1 ? "es" : ""}`}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={fetchMailboxes}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-gray-400" : "text-gray-500"} />
            </button>
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={14} /> Add Mailbox
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-gray-400">
            <RefreshCw size={20} className="animate-spin" />
          </div>
        ) : mailboxes.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">
            No mailboxes yet. Add one to get started.
          </div>
        ) : (
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" /></th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Aliases</th>
                <th className="px-4 py-3">Storage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {mailboxes.map((mb) => {
                const pct = mb.usedPercent ?? 0;
                return (
                  <tr key={mb.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3"><input type="checkbox" /></td>
                    <td className={row_className}>{mb.name || "—"}</td>
                    <td className={`${row_className} font-medium`}>{mb.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 capitalize">
                        {mb.role || "user"}
                      </span>
                    </td>
                    <td className={row_className}>{mb.phone || "—"}</td>
                    <td className={row_className}>{mb.aliases ?? 0}</td>
                    <td className={row_className}>
                      <div className="flex items-center gap-2">
                        <svg width="32" height="32">
                          <circle cx="16" cy="16" r="14" strokeWidth="4" className="stroke-gray-200" fill="none" />
                          <circle
                            cx="16" cy="16" r="14" strokeWidth="4" fill="none"
                            strokeDasharray={88}
                            strokeDashoffset={88 - (88 * pct) / 100}
                            className={storageColor(pct)}
                            transform="rotate(-90 16 16)"
                          />
                        </svg>
                        <span className="text-sm">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        mb.active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      )}>
                        {mb.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-28">
                      <ReactApexChart
                        options={sparklineOptions}
                        series={[{ data: mb.sentStats || [0, 0, 0, 0, 0, 0, 0] }]}
                        type="area"
                        height={40}
                      />
                    </td>
                    <td className={`${row_className} relative`}>
                      <div ref={menuRef} className="inline-block">
                        <button
                          onClick={() => setOpenMenu(openMenu === mb.id ? null : mb.id)}
                          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {openMenu === mb.id && (
                          <div className="absolute right-10 top-0 w-44 rounded-lg border bg-white dark:bg-gray-900 shadow-lg z-50">
                            <button
                              onClick={() => openEdit(mb)}
                              className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <Pencil size={13} /> Edit
                            </button>
                            <button
                              onClick={() => { setDeleteTarget(mb); setOpenMenu(null); }}
                              className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Mailbox Modal */}
      <AddUserModal isOpen={isOpen} onClose={() => { closeModal(); fetchMailboxes(); }} />

      {/* Edit Mailbox Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-gray-800 dark:text-white">Edit Mailbox</h2>
          <p className="text-sm text-gray-500">{editTarget?.email}</p>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quota (MB)</label>
            <Input type="number" value={editQuota} onChange={(e) => setEditQuota(e.target.value)} />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="mb-active"
              checked={editActive}
              onChange={(e) => setEditActive(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="mb-active" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-gray-800 dark:text-white">Delete Mailbox</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Permanently delete <span className="font-medium text-red-600">{deleteTarget?.email}</span>? All mail will be lost.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 text-sm border rounded-lg">Cancel</button>
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
