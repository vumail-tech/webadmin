"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Plus,
  Trash2,
  Upload,
  Users,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import {
  adminBulkMigration,
  adminGetMigrationJobs,
  adminUploadMigration,
} from "@/api/admin";
import { card_className } from "./config";

interface BulkAccount {
  sourceEmail: string;
  sourcePassword: string;
}

interface BulkJob {
  sourceEmail: string;
  targetEmail: string | null;
  jobId: string | null;
  status: "started" | "unmatched";
}

interface MailboxProgress {
  address: string;
  status: "pending" | "running" | "completed" | "failed";
  totalMessages: number;
  copiedMessages: number;
  failedMessages: number;
  currentFolder?: string | null;
  error?: string | null;
}

interface MigrationJobRecord {
  jobId: string;
  type: "single" | "bulk";
  status: "pending" | "running" | "completed" | "failed";
  source: { host: string; username: string };
  mailboxes: MailboxProgress[];
  totalMessages: number;
  copiedMessages: number;
  failedMessages: number;
  startedAt: string;
  completedAt?: string | null;
  error?: string | null;
}

function parseCsv(text: string): BulkAccount[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !line.startsWith("#") &&
        !line.toLowerCase().startsWith("source"),
    )
    .map((line) => {
      const [sourceEmail, sourcePassword] = line
        .split(",")
        .map((s) => s.trim());
      return { sourceEmail, sourcePassword };
    })
    .filter((a) => a.sourceEmail && a.sourcePassword);
}

function pct(copied: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((copied / total) * 100));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function StatusBadge({ status }: { status: MigrationJobRecord["status"] }) {
  const map = {
    pending: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    running: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    completed: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status]}`}>
      {status === "running" && <Loader2 size={10} className="inline animate-spin mr-1" />}
      {status}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
      <div
        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function HistoryTable({
  jobs,
  onRefresh,
  loading,
}: {
  jobs: MigrationJobRecord[];
  onRefresh: () => void;
  loading: boolean;
}) {
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  if (!jobs.length) return null;

  return (
    <div className={card_className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white">
          Migration History
        </h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {jobs.map((job) => {
          const p = pct(job.copiedMessages, job.totalMessages);
          const isOpen = expandedJob === job.jobId;
          return (
            <div key={job.jobId} className="py-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedJob(isOpen ? null : job.jobId)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={job.status} />
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
                      {job.source?.username} → {job.mailboxes.length} mailbox(es)
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <Clock size={10} />
                      {fmtDate(job.startedAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="text-right text-xs text-gray-500 hidden sm:block">
                    <span className="text-green-600 font-medium">{job.copiedMessages}</span>
                    {" / "}
                    {job.totalMessages || "?"} msgs
                    {job.failedMessages > 0 && (
                      <span className="text-red-400 ml-1">· {job.failedMessages} failed</span>
                    )}
                  </div>
                  {isOpen ? (
                    <ChevronUp size={14} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-400" />
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="mt-3 space-y-2">
                  {job.totalMessages > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Overall</span>
                        <span>{p}%</span>
                      </div>
                      <ProgressBar value={p} />
                    </div>
                  )}
                  {job.mailboxes.map((mb) => (
                    <div
                      key={mb.address}
                      className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-gray-700 dark:text-gray-300">
                          {mb.address}
                        </span>
                        <StatusBadge status={mb.status} />
                      </div>
                      <p className="text-gray-400">
                        {mb.copiedMessages} copied · {mb.failedMessages} failed
                        {mb.totalMessages ? ` · ${mb.totalMessages} total` : ""}
                      </p>
                      {mb.error && <p className="text-red-500">{mb.error}</p>}
                    </div>
                  ))}
                  {job.completedAt && (
                    <p className="text-xs text-gray-400">Completed: {fmtDate(job.completedAt)}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UploadArchiveSection({
  domain,
  onJobStarted,
}: {
  domain: string;
  onJobStarted: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [targetMailbox, setTargetMailbox] = useState("");
  const [phase, setPhase] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadPct, setUploadPct] = useState(0);
  const [result, setResult] = useState<{ jobId: string; mailboxCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = phase === "uploading";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.name.endsWith(".zip")) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setPhase("uploading");
    setUploadPct(0);
    setResult(null);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    if (targetMailbox.trim()) formData.append("targetMailbox", targetMailbox.trim());
    try {
      const res = await adminUploadMigration(domain, formData, setUploadPct);
      if (res?.success) {
        setResult(res.data);
        setPhase("done");
        setFile(null);
        setTargetMailbox("");
        onJobStarted();
      } else {
        setError(res?.message || "Upload failed");
        setPhase("error");
      }
    } catch {
      setError("Upload failed. Check the file and try again.");
      setPhase("error");
    }
  };

  return (
    <div className={card_className}>
      <div className="flex items-center gap-2 mb-1">
        <Upload size={16} className="text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
          Upload Mail Archive
        </h4>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Upload a <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">.zip</code> of
        Maildir files exported from another server. Folder names inside the zip must match mailbox
        local parts on <strong>{domain}</strong> (e.g.{" "}
        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">sales/</code>,{" "}
        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">info/</code>).
      </p>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !busy && fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${
          file
            ? "border-blue-400 bg-blue-50 dark:bg-blue-500/10"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
        } ${busy ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={handleFileChange}
        />
        <Upload size={22} className={file ? "text-blue-500" : "text-gray-400"} />
        {file ? (
          <div className="text-center">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{file.name}</p>
            <p className="text-xs text-gray-400">
              {(file.size / 1024 / 1024).toFixed(1)} MB — click to change
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-500">Drop a .zip here or click to browse</p>
            <p className="text-xs text-gray-400">Maildir structure (.zip)</p>
          </div>
        )}
      </div>

      {/* Optional target mailbox for single-mailbox zips */}
      <div className="mt-3 space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Target Mailbox{" "}
          <span className="font-normal text-gray-400">(only needed for single-mailbox zips)</span>
        </label>
        <input
          type="text"
          placeholder={`e.g. user@${domain}`}
          value={targetMailbox}
          onChange={(e) => setTargetMailbox(e.target.value)}
          disabled={busy}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-white disabled:opacity-50"
        />
      </div>

      {/* Feedback */}
      {phase === "done" && result && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-lg text-sm bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle size={14} />
          Import started for {result.mailboxCount} mailbox(es). Track progress below.
        </div>
      )}
      {phase === "error" && error && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <XCircle size={14} /> {error}
        </div>
      )}

      {/* Upload progress bar */}
      {phase === "uploading" && (
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin" /> Uploading archive…
            </span>
            <span className="font-medium tabular-nums">{uploadPct}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${uploadPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {uploadPct < 100
              ? "Sending file to server…"
              : "Processing zip and starting import…"}
          </p>
        </div>
      )}

      <div className="mt-4">
        <Button
          onClick={handleUpload}
          disabled={busy || !file}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {busy ? (
            <>
              <Loader2 size={14} className="animate-spin" /> {uploadPct < 100 ? `Uploading ${uploadPct}%` : "Processing…"}
            </>
          ) : (
            <>
              <Upload size={14} /> Upload &amp; Import
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function MigrationTab() {
  const { domain } = useParams() as { domain: string };

  // History
  const [historyJobs, setHistoryJobs] = useState<MigrationJobRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await adminGetMigrationJobs(domain);
      if (res?.success) setHistoryJobs(res.data || []);
    } finally {
      setHistoryLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Polls history until all active jobs settle
  const startHistoryPoll = useCallback(() => {
    if (historyPollRef.current) return;
    historyPollRef.current = setInterval(async () => {
      try {
        const res = await adminGetMigrationJobs(domain);
        if (res?.success) {
          const jobs: MigrationJobRecord[] = res.data || [];
          setHistoryJobs(jobs);
          const anyActive = jobs.some(
            (j) => j.status === "pending" || j.status === "running",
          );
          if (!anyActive) {
            clearInterval(historyPollRef.current!);
            historyPollRef.current = null;
          }
        }
      } catch {}
    }, 2500);
  }, [domain]);

  useEffect(() => {
    return () => {
      if (historyPollRef.current) clearInterval(historyPollRef.current);
    };
  }, []);

  // Bulk migration state
  const [bulkHost, setBulkHost] = useState("");
  const [bulkPort, setBulkPort] = useState("993");
  const [bulkEncryption, setBulkEncryption] = useState("ssl");
  const [accounts, setAccounts] = useState<BulkAccount[]>([
    { sourceEmail: "", sourcePassword: "" },
  ]);
  const [bulkPhase, setBulkPhase] = useState<"idle" | "running" | "done" | "error">("idle");
  const [bulkJobs, setBulkJobs] = useState<BulkJob[]>([]);
  const [bulkSummary, setBulkSummary] = useState<{ started: number; unmatched: number } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const bulkBusy = bulkPhase === "running";

  const updateAccount = (i: number, field: keyof BulkAccount, value: string) =>
    setAccounts((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)),
    );

  const addRow = () =>
    setAccounts((prev) => [...prev, { sourceEmail: "", sourcePassword: "" }]);

  const removeRow = (i: number) =>
    setAccounts((prev) => prev.filter((_, idx) => idx !== i));

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCsv(ev.target?.result as string);
      if (parsed.length) setAccounts(parsed);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleBulkStart = async () => {
    const validAccounts = accounts.filter((a) => a.sourceEmail && a.sourcePassword);
    if (!bulkHost || !validAccounts.length) return;
    setBulkPhase("running");
    setBulkJobs([]);
    setBulkSummary(null);
    try {
      const res = await adminBulkMigration(domain, {
        imapHost: bulkHost,
        imapPort: parseInt(bulkPort),
        encryption: bulkEncryption,
        accounts: validAccounts,
      });
      if (res?.success) {
        setBulkJobs(res.data?.jobs || []);
        setBulkSummary({ started: res.data?.started, unmatched: res.data?.unmatched });
        setBulkPhase("done");
        startHistoryPoll();
      } else {
        setBulkPhase("error");
      }
    } catch {
      setBulkPhase("error");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Upload Archive */}
      <UploadArchiveSection domain={domain} onJobStarted={startHistoryPoll} />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
        <span className="text-xs text-gray-400 shrink-0">or migrate via IMAP</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users size={16} className="text-gray-500" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            Bulk Migration
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Migrate multiple accounts at once. Each source account is matched to a mailbox on{" "}
          <strong>{domain}</strong> by its local part (e.g.{" "}
          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">user@zoho.com</code>
          {" → "}
          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">user@{domain}</code>).
        </p>
      </div>

      {/* Source server */}
      <div className={card_className}>
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
          Source Server
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1 space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              IMAP Host
            </label>
            <Input
              placeholder="imap.zoho.com"
              value={bulkHost}
              onChange={(e) => setBulkHost(e.target.value)}
              disabled={bulkBusy}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Port</label>
            <Input
              placeholder="993"
              value={bulkPort}
              onChange={(e) => setBulkPort(e.target.value)}
              disabled={bulkBusy}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Encryption
            </label>
            <select
              value={bulkEncryption}
              onChange={(e) => setBulkEncryption(e.target.value)}
              disabled={bulkBusy}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
            >
              <option value="ssl">SSL/TLS</option>
              <option value="starttls">STARTTLS</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
      </div>

      {/* Accounts table */}
      <div className={card_className}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
            Accounts{" "}
            <span className="text-gray-400 font-normal">
              ({accounts.filter((a) => a.sourceEmail).length})
            </span>
          </h4>
          <div className="flex gap-2">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleCsvUpload}
            />
            <button
              onClick={() => csvInputRef.current?.click()}
              disabled={bulkBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <Upload size={12} /> Upload CSV
            </button>
            <button
              onClick={addRow}
              disabled={bulkBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={12} /> Add Row
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-3">
          CSV format:{" "}
          <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
            source_email,source_password
          </code>{" "}
          — one account per line, no header required.
        </p>

        <div className="space-y-2">
          {accounts.map((acc, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  placeholder="user@zoho.com"
                  value={acc.sourceEmail}
                  onChange={(e) => updateAccount(i, "sourceEmail", e.target.value)}
                  disabled={bulkBusy}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="password"
                  placeholder="Password"
                  value={acc.sourcePassword}
                  onChange={(e) => updateAccount(i, "sourcePassword", e.target.value)}
                  disabled={bulkBusy}
                />
              </div>
              <button
                onClick={() => removeRow(i)}
                disabled={bulkBusy || accounts.length === 1}
                className="p-2 text-red-400 hover:text-red-600 disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Results table */}
        {bulkJobs.length > 0 && (
          <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div
              className={`px-3 py-2 text-xs font-medium flex items-center gap-2 ${
                bulkPhase === "done"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {bulkPhase === "done" ? <CheckCircle size={13} /> : <XCircle size={13} />}
              {bulkSummary &&
                `${bulkSummary.started} started · ${bulkSummary.unmatched} unmatched`}
            </div>
            <table className="min-w-full text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-left">Destination</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {bulkJobs.map((job, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-2 font-mono">{job.sourceEmail}</td>
                    <td className="px-3 py-2 font-mono text-gray-400">
                      {job.targetEmail ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          job.status === "started"
                            ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                        }`}
                      >
                        {job.status === "started" ? "Started" : "No match"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {bulkPhase === "error" && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <XCircle size={14} /> Failed to start bulk migration. Check your server details and try
            again.
          </div>
        )}

        <div className="mt-4">
          <Button
            onClick={handleBulkStart}
            disabled={
              bulkBusy ||
              !bulkHost ||
              !accounts.some((a) => a.sourceEmail && a.sourcePassword)
            }
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {bulkBusy ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Starting…
              </>
            ) : (
              <>
                <Play size={14} /> Start Bulk Migration
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Migration History */}
      <HistoryTable jobs={historyJobs} onRefresh={loadHistory} loading={historyLoading} />
    </div>
  );
}
