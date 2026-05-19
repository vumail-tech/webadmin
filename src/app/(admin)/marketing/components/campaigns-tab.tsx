"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw, PlusCircle, Send, Trash2, Pencil, Clock, BarChart2,
} from "lucide-react";
import {
  adminGetCampaigns, adminCreateCampaign, adminUpdateCampaign,
  adminDeleteCampaign, adminSendCampaign, adminScheduleCampaign,
  adminGetContactLists, adminGetTemplates,
} from "@/api/admin";
import { Campaign, CampaignStatus, ContactList, EmailTemplate } from "@/types/marketing";
import { Modal } from "@/components/ui/modal";

const statusColors: Record<CampaignStatus, string> = {
  draft:     "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  sending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
  sent:      "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  paused:    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

export const EMPTY_FORM = {
  name: "", subject: "", fromName: "", fromEmail: "", listId: "", templateId: "",
};

type FormState = typeof EMPTY_FORM;

// ─── Lifted out of CampaignsTab so React never remounts it on parent re-render ─
interface CampaignFormProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  lists: ContactList[];
  templates: EmailTemplate[];
  saving: boolean;
  isEdit: boolean;
  onCancel: () => void;
  onSave: () => void;
}

function CampaignForm({
  form, setForm, lists, templates, saving, isEdit, onCancel, onSave,
}: CampaignFormProps) {
  const inputCls = "w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-200";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Campaign Name</label>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. June Newsletter"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email Subject</label>
          <input
            className={inputCls}
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="Your email subject line"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">From Name</label>
          <input
            className={inputCls}
            value={form.fromName}
            onChange={(e) => setForm((f) => ({ ...f, fromName: e.target.value }))}
            placeholder="Your Company"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">From Email</label>
          <input
            className={inputCls}
            value={form.fromEmail}
            onChange={(e) => setForm((f) => ({ ...f, fromEmail: e.target.value }))}
            placeholder="hello@yourdomain.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Contact List</label>
          <select
            className={inputCls}
            value={form.listId}
            onChange={(e) => setForm((f) => ({ ...f, listId: e.target.value }))}
          >
            <option value="">Select a list…</option>
            {lists.map((l) => (
              <option key={l._id} value={l._id}>{l.name} ({l.subscriberCount})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Template (optional)</label>
          <select
            className={inputCls}
            value={form.templateId}
            onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}
          >
            <option value="">No template</option>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving || !form.name || !form.subject || !form.listId}
          className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Campaign"}
        </button>
      </div>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [sendTarget, setSendTarget] = useState<Campaign | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<Campaign | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cr, lr, tr] = await Promise.all([
        adminGetCampaigns(),
        adminGetContactLists(),
        adminGetTemplates(),
      ]);
      if (cr?.success) setCampaigns(cr.data || []);
      if (lr?.success) setLists(lr.data || []);
      if (tr?.success) setTemplates(tr.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openEdit = (c: Campaign) => {
    setForm({
      name: c.name, subject: c.subject,
      fromName: c.fromName, fromEmail: c.fromEmail,
      listId: c.listId, templateId: c.templateId ?? "",
    });
    setEditTarget(c);
  };

  const closeForm = () => {
    setShowCreate(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTarget) {
        await adminUpdateCampaign(editTarget._id, form);
      } else {
        await adminCreateCampaign(form);
      }
      closeForm();
      fetchAll();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteCampaign(deleteTarget._id);
      setDeleteTarget(null);
      fetchAll();
    } finally {
      setDeleting(false);
    }
  };

  const handleSend = async () => {
    if (!sendTarget) return;
    setSending(true);
    try {
      await adminSendCampaign(sendTarget._id);
      setSendTarget(null);
      fetchAll();
    } finally {
      setSending(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleTarget || !scheduleAt) return;
    setSaving(true);
    try {
      await adminScheduleCampaign(scheduleTarget._id, new Date(scheduleAt).toISOString());
      setScheduleTarget(null);
      setScheduleAt("");
      fetchAll();
    } finally {
      setSaving(false);
    }
  };

  const rate = (n: number, total: number) =>
    total ? `${((n / total) * 100).toFixed(1)}%` : "—";

  const sharedFormProps = { form, setForm, lists, templates, saving, onSave: handleSave };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? "Loading…" : `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""}`}
        </p>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusCircle size={15} /> New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw size={22} className="animate-spin mr-2" /> Loading…
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <Send size={40} className="opacity-30" />
          <p className="text-sm">No campaigns yet. Create your first campaign to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">List</th>
                <th className="px-4 py-3">Sent</th>
                <th className="px-4 py-3">Open Rate</th>
                <th className="px-4 py-3">Click Rate</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {campaigns.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-white/90">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{c.subject}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.listName ?? "—"}</td>
                  <td className="px-4 py-3">{c.stats.sent.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <BarChart2 size={13} className="text-blue-400" />
                      {rate(c.stats.opened, c.stats.delivered)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{rate(c.stats.clicked, c.stats.opened)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(c.sentAt ?? c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {c.status === "draft" && (
                        <>
                          <button onClick={() => setSendTarget(c)} className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600" title="Send now">
                            <Send size={13} />
                          </button>
                          <button onClick={() => { setScheduleTarget(c); setScheduleAt(""); }} className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500" title="Schedule">
                            <Clock size={13} />
                          </button>
                        </>
                      )}
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={closeForm} className="max-w-lg">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">New Campaign</h2>
        <CampaignForm {...sharedFormProps} isEdit={false} onCancel={closeForm} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editTarget} onClose={closeForm} className="max-w-lg">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Edit Campaign</h2>
        <CampaignForm {...sharedFormProps} isEdit={true} onCancel={closeForm} />
      </Modal>

      {/* Send confirmation */}
      <Modal isOpen={!!sendTarget} onClose={() => setSendTarget(null)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Send Campaign Now</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Send <strong className="text-gray-800 dark:text-white">{sendTarget?.name}</strong> to the entire contact list immediately? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setSendTarget(null)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button onClick={handleSend} disabled={sending} className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60">
              {sending ? "Sending…" : "Send Now"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Schedule modal */}
      <Modal isOpen={!!scheduleTarget} onClose={() => setScheduleTarget(null)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Schedule Campaign</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Send at</label>
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setScheduleTarget(null)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button onClick={handleSchedule} disabled={saving || !scheduleAt} className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Scheduling…" : "Schedule"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Delete Campaign</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Permanently delete <strong className="text-gray-800 dark:text-white">{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
