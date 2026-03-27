"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { adminGetAliases, adminAddAlias, adminDeleteAlias, adminToggleAlias } from "@/api/admin";
import { adminGetMailboxes } from "@/api/admin";
import { card_className } from "./config";

interface Alias {
  _id?: string;
  address: string;
  active: boolean;
  mailbox: string;
  mailboxId: string;
}

export default function AliasesTab() {
  const { domain } = useParams() as { domain: string };
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [mailboxes, setMailboxes] = useState<{ email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Alias | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add form state
  const [selectedMailbox, setSelectedMailbox] = useState("");
  const [aliasLocal, setAliasLocal] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aliasRes, mbRes] = await Promise.all([
        adminGetAliases(domain),
        adminGetMailboxes(domain),
      ]);
      if (aliasRes?.success) setAliases(aliasRes.data || []);
      if (mbRes?.success) setMailboxes(mbRes.data || []);
      else if (Array.isArray(mbRes)) setMailboxes(mbRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (domain) fetchAll(); }, [domain]);

  const handleAdd = async () => {
    if (!selectedMailbox || !aliasLocal.trim()) {
      setAddError("Mailbox and alias name are required");
      return;
    }
    const alias = `${aliasLocal.trim()}@${domain}`;
    setAddLoading(true);
    setAddError(null);
    try {
      const rs = await adminAddAlias(domain, { mailboxAddress: selectedMailbox, alias });
      if (rs?.success) {
        setIsOpen(false);
        setAliasLocal("");
        setSelectedMailbox("");
        fetchAll();
      } else {
        setAddError(rs?.message || "Failed to add alias");
      }
    } catch {
      setAddError("Failed to add alias");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteAlias(domain, {
        alias: deleteTarget.address,
        mailboxAddress: deleteTarget.mailbox,
      });
      setDeleteTarget(null);
      fetchAll();
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (alias: Alias) => {
    try {
      await adminToggleAlias(domain, {
        alias: alias.address,
        active: !alias.active,
        mailboxAddress: alias.mailbox,
      });
      setAliases((prev) =>
        prev.map((a) => a.address === alias.address ? { ...a, active: !a.active } : a)
      );
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className={card_className}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {aliases.length} alias{aliases.length !== 1 ? "es" : ""}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={fetchAll}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-gray-400" : "text-gray-500"} />
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={14} /> Add Alias
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-10 text-gray-400">
            <RefreshCw size={20} className="animate-spin" />
          </div>
        ) : aliases.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No aliases yet. Add one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Alias</th>
                  <th className="px-4 py-3 text-left">Delivers To</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {aliases.map((alias) => (
                  <tr key={alias.address} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                      {alias.address}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{alias.mailbox}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          alias.active
                            ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {alias.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(alias)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title={alias.active ? "Disable" : "Enable"}
                        >
                          {alias.active ? (
                            <ToggleRight size={16} className="text-green-600" />
                          ) : (
                            <ToggleLeft size={16} className="text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(alias)}
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

      {/* Add Alias Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-gray-800 dark:text-white">Add Alias</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Delivers to mailbox</label>
            <select
              value={selectedMailbox}
              onChange={(e) => setSelectedMailbox(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select mailbox…</option>
              {mailboxes.map((m: any) => (
                <option key={m.email || m.id} value={m.email}>{m.email}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alias address</label>
            <div className="flex items-center gap-2">
              <Input placeholder="info" value={aliasLocal} onChange={(e) => setAliasLocal(e.target.value)} />
              <span className="text-sm text-gray-500 whitespace-nowrap">@{domain}</span>
            </div>
          </div>

          {addError && <p className="text-sm text-red-500">{addError}</p>}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <Button onClick={handleAdd} disabled={addLoading}>
              {addLoading ? "Adding…" : "Add Alias"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-gray-800 dark:text-white">Delete Alias</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Delete alias <span className="font-medium text-red-600">{deleteTarget?.address}</span>? This cannot be undone.
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
    </div>
  );
}
