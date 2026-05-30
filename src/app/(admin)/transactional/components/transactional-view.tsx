"use client";

import { useEffect, useState } from "react";
import {
  Key, RefreshCw, Copy, Check, Trash2, Eye, EyeOff,
  AlertCircle, BookOpen, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  adminGetTransactionalKeys,
  adminGenerateTransactionalKey,
  adminRevokeTransactionalKey,
  adminGetTransactionalLogs,
} from "@/api/admin";
import { TransactionalDomain, TransactionalLog } from "@/types/transactional";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";

const card = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]";

const statusBadgeColor = (s: string) =>
  s === "ACTIVE" ? "success" : s === "PENDING_DNS" ? "warning" : "error";

const logStatusColor: Record<string, string> = {
  delivered: "text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400",
  bounced: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400",
  deferred: "text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 dark:text-yellow-400",
  failed: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400",
};

export default function TransactionalView() {
  const [domains, setDomains] = useState<TransactionalDomain[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate key modal
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<{ key: string; keyId: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  // Revoke modal
  const [revokeTarget, setRevokeTarget] = useState<TransactionalDomain | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Logs panel
  const [logsFor, setLogsFor] = useState<string | null>(null);
  const [logs, setLogs] = useState<TransactionalLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Expanded code snippets
  const [expandedSnippet, setExpandedSnippet] = useState<string | null>(null);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const rs = await adminGetTransactionalKeys();
      if (rs?.success) setDomains(rs.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleGenerate = async () => {
    if (!generatingFor) return;
    setGenerating(true);
    try {
      const rs = await adminGenerateTransactionalKey(generatingFor);
      if (rs?.success) {
        setNewKey(rs.data);
        fetchKeys();
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget?.keyId) return;
    setRevoking(true);
    try {
      await adminRevokeTransactionalKey(revokeTarget.domain, revokeTarget.keyId);
      setRevokeTarget(null);
      fetchKeys();
    } finally {
      setRevoking(false);
    }
  };

  const openLogs = async (domain: string) => {
    setLogsFor(domain);
    setLogsLoading(true);
    try {
      const rs = await adminGetTransactionalLogs(domain, { limit: 20 });
      if (rs?.success) setLogs(rs.data || []);
    } finally {
      setLogsLoading(false);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const apiBase = `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api`;

  const codeSnippet = (domain: string, key: string) => `curl -X POST ${apiBase}/transactional/send \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "no-reply@${domain}",
    "to": "user@example.com",
    "subject": "Hello from ${domain}",
    "html": "<p>Your message here</p>"
  }'`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Transactional Email</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Generate per-domain API keys to send transactional emails (receipts, alerts, password resets) via REST.
          </p>
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <BookOpen size={15} /> API Docs
        </a>
      </div>

      {/* Domains table */}
      <div className={card}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw size={22} className="animate-spin mr-2" /> Loading…
          </div>
        ) : domains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <Key size={40} className="opacity-30" />
            <p className="text-sm">No domains found. Add a domain first to generate an API key.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">API Key</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3">Last Used</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {domains.map((d) => (
                  <tr key={d.domain} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{d.domain}</td>
                    <td className="px-4 py-3">
                      <Badge color={statusBadgeColor(d.status)}>
                        {d.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {d.hasKey ? (
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {d.keyPreview ?? "••••••••••••"}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">No key</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{d.sentCount?.toLocaleString() ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {d.lastUsed ? new Date(d.lastUsed).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {d.hasKey ? (
                          <>
                            <button
                              onClick={() => openLogs(d.domain)}
                              className="px-2.5 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              Logs
                            </button>
                            <button
                              onClick={() => { setGeneratingFor(d.domain); setNewKey(null); }}
                              className="px-2.5 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              Regenerate
                            </button>
                            <button
                              onClick={() => setRevokeTarget(d)}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                              title="Revoke key"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => { setGeneratingFor(d.domain); setNewKey(null); }}
                            disabled={d.status !== "ACTIVE"}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Key size={12} /> Generate Key
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick start card */}
      <div className={`${card} bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30`}>
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-white">API key security</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Your API key is shown only once at generation. Store it securely (e.g. environment variable).
              Regenerating a key immediately invalidates the previous one.
            </p>
          </div>
        </div>
      </div>

      {/* Generate / Regenerate modal */}
      <Modal
        isOpen={!!generatingFor}
        onClose={() => { setGeneratingFor(null); setNewKey(null); setKeyCopied(false); }}
        className="max-w-lg"
      >
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {newKey ? "API Key Generated" : `Generate API Key — ${generatingFor}`}
          </h2>

          {!newKey ? (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {domains.find(d => d.domain === generatingFor)?.hasKey
                  ? "Regenerating will immediately invalidate the existing key. Any apps using it will stop working."
                  : `Generate an API key to send transactional emails from ${generatingFor}.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setGeneratingFor(null)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {generating ? "Generating…" : "Generate Key"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                  Your API Key — copy it now, it won't be shown again
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-gray-800 dark:text-gray-200 break-all">
                    {newKey.key}
                  </code>
                  <button
                    onClick={() => copyKey(newKey.key)}
                    className="flex-shrink-0 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700"
                  >
                    {keyCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Code snippet */}
              <div>
                <button
                  onClick={() => setExpandedSnippet(expandedSnippet ? null : "curl")}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {expandedSnippet ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  Show cURL example
                </button>
                {expandedSnippet && (
                  <pre className="mt-2 p-3 rounded-xl bg-gray-900 text-green-400 text-xs overflow-x-auto">
                    {codeSnippet(generatingFor!, newKey.key)}
                  </pre>
                )}
              </div>

              <button
                onClick={() => { setGeneratingFor(null); setNewKey(null); setKeyCopied(false); }}
                className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* Revoke confirmation */}
      <Modal isOpen={!!revokeTarget} onClose={() => setRevokeTarget(null)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Revoke API Key</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Revoke the API key for <strong className="text-gray-800 dark:text-white">{revokeTarget?.domain}</strong>?
            Any app using it will immediately lose access.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setRevokeTarget(null)}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
            >
              {revoking ? "Revoking…" : "Revoke Key"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Logs panel */}
      <Modal isOpen={!!logsFor} onClose={() => { setLogsFor(null); setLogs([]); }} className="max-w-3xl">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Send Logs — {logsFor}
          </h2>
          {logsLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <RefreshCw size={20} className="animate-spin mr-2" /> Loading logs…
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
              <Eye size={32} className="opacity-30" />
              <p className="text-sm">No logs yet. Logs appear after your first transactional send.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-600 dark:text-gray-300">
                <thead className="text-xs uppercase tracking-wider text-gray-400 border-b dark:border-gray-700">
                  <tr>
                    <th className="pb-2 pr-4">To</th>
                    <th className="pb-2 pr-4">Subject</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td className="py-2 pr-4 font-mono text-xs">{log.to}</td>
                      <td className="py-2 pr-4 max-w-[200px] truncate">{log.subject}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${logStatusColor[log.status]}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
