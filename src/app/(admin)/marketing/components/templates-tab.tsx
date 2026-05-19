"use client";

import { useEffect, useState } from "react";
import { RefreshCw, PlusCircle, Trash2, Pencil, Layout } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminGetTemplates, adminDeleteTemplate, adminCreateTemplate } from "@/api/admin";
import { EmailTemplate } from "@/types/marketing";
import { Modal } from "@/components/ui/modal";

export default function TemplatesTab() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const rs = await adminGetTemplates();
      if (rs?.success) setTemplates(rs.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const rs = await adminCreateTemplate({ name: newName, description: newDesc, blocks: [] });
      if (rs?.success) {
        setShowCreate(false);
        setNewName("");
        setNewDesc("");
        router.push(`/marketing/templates/${rs.data._id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteTemplate(deleteTarget._id);
      setDeleteTarget(null);
      fetchTemplates();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? "Loading…" : `${templates.length} template${templates.length !== 1 ? "s" : ""}`}
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusCircle size={15} /> New Template
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw size={22} className="animate-spin mr-2" /> Loading…
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <Layout size={40} className="opacity-30" />
          <p className="text-sm">No templates yet. Create one to design your email layout.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((t) => (
            <div key={t._id} className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors">
              {/* Preview area */}
              <div className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center border-b border-gray-100 dark:border-gray-800">
                <div className="text-center space-y-1 px-4">
                  {t.blocks.slice(0, 3).map((b, i) => (
                    <div key={i} className={`mx-auto rounded bg-gray-200 dark:bg-gray-700 ${
                      b.type === "header" ? "h-3 w-3/4" :
                      b.type === "image" ? "h-8 w-full" :
                      b.type === "button" ? "h-3 w-1/2" :
                      b.type === "divider" ? "h-px w-full" :
                      "h-2 w-full"
                    }`} />
                  ))}
                  {t.blocks.length === 0 && (
                    <Layout size={28} className="text-gray-300 dark:text-gray-600 mx-auto" />
                  )}
                </div>
              </div>
              {/* Footer */}
              <div className="p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-800 dark:text-white/90 truncate">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.blocks.length} block{t.blocks.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => router.push(`/marketing/templates/${t._id}`)}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    title="Edit template"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(t)}
                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">New Template</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Template Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Welcome Email"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description (optional)</label>
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="What this template is used for"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button onClick={handleCreate} disabled={creating || !newName.trim()} className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {creating ? "Creating…" : "Create & Edit"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Delete Template</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Permanently delete <strong className="text-gray-800 dark:text-white">{deleteTarget?.name}</strong>? Campaigns using this template won't be affected.
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
