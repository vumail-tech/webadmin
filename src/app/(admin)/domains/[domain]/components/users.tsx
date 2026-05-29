"use client";

import { cn } from "@/lib/utils";
import { card_className } from "./config";
import { useModal } from "@/hooks/useModal";
import AddUserModal from "./add-user";
import { SignatureModal } from "./signature-modal";
import { Plus, MoreHorizontal, RefreshCw, Pencil, Trash2, AlertTriangle, PenLine, KeyRound, Copy, Check, Mail, ShieldCheck, ShieldOff } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminGetMailboxes, adminDeleteMailbox, adminUpdateMailbox, adminResetMailboxPassword } from "@/api/admin";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";

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
  messages: number;
  lastImapLogin: number | null;
  lastSmtpLogin: number | null;
  lastPop3Login: number | null;
  tlsEnforceIn: boolean;
  tlsEnforceOut: boolean;
  createdAt: string;
};

function formatStorage(mb: number): string {
  if (!mb || mb === 0) return "0 B";
  const bytes = mb * 1024 * 1024;
  if (bytes < 1024) return `${bytes.toFixed(0)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatLogin(ts: number | null): string {
  if (!ts) return "Never";
  const d = new Date(ts * 1000);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function UsersTable({ domainStatus }: { domainStatus?: string }) {
  const { openModal, isOpen, closeModal } = useModal();
  const domain = useParams().domain as string;
  const isVerified = domainStatus === "ACTIVE";

  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Modals
  const [editTarget, setEditTarget] = useState<Mailbox | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mailbox | null>(null);
  const [signatureTarget, setSignatureTarget] = useState<Mailbox | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editQuota, setEditQuota] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);

  // Reset password
  const [resetTarget, setResetTarget] = useState<Mailbox | null>(null);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [copied, setCopied] = useState(false);

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
    if (!openMenu) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-menu-container]")) {
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
        // editQuota is in GB — convert to MB before sending
        ...(editQuota ? { quotaMB: Math.round(parseFloat(editQuota) * 1024) } : {}),
      });
      setEditTarget(null);
      fetchMailboxes();
    } finally {
      setEditSaving(false);
    }
  };

  const openEdit = (mb: Mailbox) => {
    setEditTarget(mb);
    // Show quota in GB
    setEditQuota(mb.quotaMB ? (mb.quotaMB / 1024).toFixed(1) : "");
    setEditActive(mb.active);
    setOpenMenu(null);
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const rs = await adminResetMailboxPassword(domain, resetTarget.id);
      if (rs?.success) setNewPassword(rs.data.password);
    } finally {
      setResetting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const storageColor = (pct: number) =>
    pct >= 85 ? "stroke-red-500" : pct >= 60 ? "stroke-yellow-500" : "stroke-green-500";

  const row_className = "px-4 py-3 text-gray-700 dark:text-gray-300 text-sm";

  return (
    <>
      {!isVerified && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-900/10 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            DNS records must be verified before adding mailboxes.{" "}
            <button
              onClick={() => {
                const el = document.querySelector('[data-tab="records"]') as HTMLElement;
                el?.click();
              }}
              className="underline font-medium"
            >
              Go to Records tab to verify.
            </button>
          </span>
        </div>
      )}
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
              onClick={isVerified ? openModal : undefined}
              disabled={!isVerified}
              title={!isVerified ? "Verify DNS records first" : undefined}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-lg",
                isVerified
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed"
              )}
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
                <th className="px-4 py-3">Aliases</th>
                <th className="px-4 py-3">Messages</th>
                <th className="px-4 py-3">Storage</th>
                <th className="px-4 py-3">TLS</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {mailboxes.map((mb) => {
                const pct = mb.usedPercent ?? 0;
                return (
                  <tr key={mb.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3"><input type="checkbox" /></td>
                    <td className={row_className}>
                      <div className="font-medium">{mb.name || "—"}</div>
                      {mb.phone && <div className="text-xs text-gray-400">{mb.phone}</div>}
                    </td>
                    <td className={`${row_className} font-mono text-xs`}>{mb.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 capitalize">
                        {mb.role || "user"}
                      </span>
                    </td>
                    <td className={row_className}>{mb.aliases ?? 0}</td>
                    <td className={row_className}>
                      <div className="flex items-center gap-1">
                        <Mail size={12} className="text-gray-400 shrink-0" />
                        <span>{mb.messages?.toLocaleString() ?? 0}</span>
                      </div>
                    </td>
                    <td className={row_className}>
                      <div className="flex items-center gap-2">
                        <svg width="32" height="32" className="shrink-0">
                          <circle cx="16" cy="16" r="14" strokeWidth="4" className="stroke-gray-200" fill="none" />
                          <circle
                            cx="16" cy="16" r="14" strokeWidth="4" fill="none"
                            strokeDasharray={88}
                            strokeDashoffset={88 - (88 * pct) / 100}
                            className={storageColor(pct)}
                            transform="rotate(-90 16 16)"
                          />
                        </svg>
                        <div>
                          <div className="text-xs font-medium">{pct}%</div>
                          <div className="text-xs text-gray-400">{formatStorage(mb.quotaUsedMB)} / {formatStorage(mb.quotaMB)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <span title={`IMAP TLS: ${mb.tlsEnforceIn ? "Enforced" : "Optional"}`}>
                          {mb.tlsEnforceIn
                            ? <ShieldCheck size={14} className="text-green-500" />
                            : <ShieldOff size={14} className="text-gray-400" />
                          }
                        </span>
                        <span title={`SMTP TLS: ${mb.tlsEnforceOut ? "Enforced" : "Optional"}`}>
                          {mb.tlsEnforceOut
                            ? <ShieldCheck size={14} className="text-green-500" />
                            : <ShieldOff size={14} className="text-gray-400" />
                          }
                        </span>
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
                    <td className={row_className}>
                      <div className="text-xs space-y-0.5">
                        <div className="flex gap-1">
                          <span className="text-gray-400 w-10">IMAP</span>
                          <span>{formatLogin(mb.lastImapLogin)}</span>
                        </div>
                        <div className="flex gap-1">
                          <span className="text-gray-400 w-10">POP3</span>
                          <span>{formatLogin(mb.lastPop3Login)}</span>
                        </div>
                        <div className="flex gap-1">
                          <span className="text-gray-400 w-10">SMTP</span>
                          <span>{formatLogin(mb.lastSmtpLogin)}</span>
                        </div>
                      </div>
                    </td>
                    <td className={`${row_className} relative`}>
                      <div className="inline-block" data-menu-container>
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
                              onClick={() => { setSignatureTarget(mb); setOpenMenu(null); }}
                              className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <PenLine size={13} /> Signature
                            </button>
                            <button
                              onClick={() => { setResetTarget(mb); setNewPassword(""); setCopied(false); setOpenMenu(null); }}
                              className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <KeyRound size={13} /> Reset Password
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quota (GB)</label>
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

      {/* Reset Password Modal */}
      <Modal isOpen={!!resetTarget} onClose={() => { setResetTarget(null); setNewPassword(""); }} className="max-w-md">
        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-gray-800 dark:text-white">Reset Password</h2>
          <p className="text-sm text-gray-500">{resetTarget?.email}</p>

          {!newPassword ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                A new password will be generated and applied to both the mailbox and the user account.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setResetTarget(null)}
                  className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <Button onClick={handleResetPassword} disabled={resetting}>
                  {resetting ? "Resetting…" : "Reset Password"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Password reset successfully. Copy and share it with the user.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2">
                <code className="flex-1 text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                  {newPassword}
                </code>
                <button
                  onClick={handleCopy}
                  className="shrink-0 p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                  title="Copy"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
              <button
                onClick={() => { setResetTarget(null); setNewPassword(""); }}
                className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* Signature Editor */}
      {signatureTarget && (
        <SignatureModal
          isOpen={!!signatureTarget}
          onClose={() => setSignatureTarget(null)}
          domain={domain}
          mailboxId={signatureTarget.id}
          mailboxEmail={signatureTarget.email}
          mailboxName={signatureTarget.name}
        />
      )}
    </>
  );
}
