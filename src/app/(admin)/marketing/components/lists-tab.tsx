"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw, PlusCircle, Trash2, Users, Upload,
  Search, X, UserMinus,
} from "lucide-react";
import {
  adminGetContactLists, adminCreateContactList, adminDeleteContactList,
  adminGetListContacts, adminImportContacts, adminRemoveContact,
} from "@/api/admin";
import { ContactList, Contact } from "@/types/marketing";
import { Modal } from "@/components/ui/modal";

export default function ListsTab() {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ContactList | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [openList, setOpenList] = useState<ContactList | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState("");

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const fetchLists = async () => {
    setLoading(true);
    try {
      const rs = await adminGetContactLists();
      if (rs?.success) setLists(rs.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLists(); }, []);

  const fetchContacts = async (list: ContactList) => {
    setOpenList(list);
    setContactsLoading(true);
    try {
      const rs = await adminGetListContacts(list._id, { limit: 50, search: contactSearch });
      if (rs?.success) setContacts(rs.data || []);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newListName.trim()) return;
    setCreating(true);
    try {
      await adminCreateContactList({ name: newListName, description: newListDesc });
      setShowCreate(false);
      setNewListName("");
      setNewListDesc("");
      fetchLists();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteContactList(deleteTarget._id);
      setDeleteTarget(null);
      fetchLists();
    } finally {
      setDeleting(false);
    }
  };

  const handleImport = async () => {
    if (!openList || !importText.trim()) return;
    setImportError("");
    setImporting(true);
    try {
      const lines = importText.trim().split("\n").filter(Boolean);
      const contacts = lines.map((line) => {
        const [email, name] = line.split(",").map((s) => s.trim());
        return { email, ...(name ? { name } : {}) };
      });
      const invalid = contacts.filter((c) => !c.email?.includes("@"));
      if (invalid.length) {
        setImportError(`${invalid.length} invalid email(s). Format: email,name (one per line)`);
        return;
      }
      await adminImportContacts(openList._id, { contacts });
      setShowImport(false);
      setImportText("");
      fetchContacts(openList);
      fetchLists();
    } finally {
      setImporting(false);
    }
  };

  const handleRemoveContact = async (email: string) => {
    if (!openList) return;
    await adminRemoveContact(openList._id, email);
    setContacts((prev) => prev.filter((c) => c.email !== email));
    setLists((prev) =>
      prev.map((l) =>
        l._id === openList._id ? { ...l, subscriberCount: l.subscriberCount - 1 } : l
      )
    );
  };

  const filteredContacts = contacts.filter(
    (c) =>
      !contactSearch ||
      c.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
      (c.name ?? "").toLowerCase().includes(contactSearch.toLowerCase())
  );

  const statusColor = (s: string) =>
    s === "subscribed"
      ? "text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400"
      : s === "unsubscribed"
      ? "text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400"
      : "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? "Loading…" : `${lists.length} list${lists.length !== 1 ? "s" : ""}`}
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusCircle size={15} /> New List
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw size={22} className="animate-spin mr-2" /> Loading…
        </div>
      ) : lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <Users size={40} className="opacity-30" />
          <p className="text-sm">No contact lists yet. Create one to start building your audience.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <div
              key={list._id}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-4 hover:border-blue-200 dark:hover:border-blue-800/50 cursor-pointer transition-colors"
              onClick={() => fetchContacts(list)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-white/90 truncate">{list.name}</p>
                  {list.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{list.description}</p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{list.subscriberCount.toLocaleString()}</span> subscribers
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created {new Date(list.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(list); }}
                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 ml-2 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create list modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">New Contact List</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">List Name</label>
            <input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g. Newsletter Subscribers"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description (optional)</label>
            <input
              value={newListDesc}
              onChange={(e) => setNewListDesc(e.target.value)}
              placeholder="Brief description of this list"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button onClick={handleCreate} disabled={creating || !newListName.trim()} className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {creating ? "Creating…" : "Create List"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Delete List</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Permanently delete <strong className="text-gray-800 dark:text-white">{deleteTarget?.name}</strong> and all {deleteTarget?.subscriberCount.toLocaleString()} contacts? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
              {deleting ? "Deleting…" : "Delete List"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Contacts drawer modal */}
      <Modal isOpen={!!openList} onClose={() => { setOpenList(null); setContacts([]); setContactSearch(""); }} className="max-w-2xl">
        {openList && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{openList.name}</h2>
                <p className="text-xs text-gray-400">{openList.subscriberCount.toLocaleString()} subscribers</p>
              </div>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload size={12} /> Import
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search contacts…"
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>

            {contactsLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <RefreshCw size={18} className="animate-spin mr-2" /> Loading…
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <Users size={28} className="opacity-30" />
                <p className="text-sm">No contacts found. Import some to get started.</p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-80">
                <table className="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
                  <thead className="text-xs uppercase tracking-wider text-gray-400 border-b dark:border-gray-700">
                    <tr>
                      <th className="pb-2 pr-4">Email</th>
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Subscribed</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredContacts.map((c) => (
                      <tr key={c.email}>
                        <td className="py-2 pr-4 font-mono text-xs">{c.email}</td>
                        <td className="py-2 pr-4 text-gray-500">{c.name ?? "—"}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(c.subscribedAt).toLocaleDateString()}
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => handleRemoveContact(c.email)}
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400"
                          >
                            <UserMinus size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Import modal */}
      <Modal isOpen={showImport} onClose={() => { setShowImport(false); setImportText(""); setImportError(""); }} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Import Contacts</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            One contact per line. Format: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">email,name</code> (name is optional).
          </p>
          <textarea
            value={importText}
            onChange={(e) => { setImportText(e.target.value); setImportError(""); }}
            placeholder={"john@example.com,John Doe\njane@example.com"}
            rows={8}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-mono dark:bg-gray-800 dark:text-gray-200 resize-none"
          />
          {importError && (
            <p className="text-xs text-red-500">{importError}</p>
          )}
          <div className="flex gap-3">
            <button onClick={() => { setShowImport(false); setImportText(""); setImportError(""); }} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button onClick={handleImport} disabled={importing || !importText.trim()} className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {importing ? "Importing…" : "Import"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
