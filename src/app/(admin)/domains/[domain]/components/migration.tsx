"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  TestTube2,
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
  adminTestMigration,
  adminStartMigration,
  adminGetMailboxes,
  adminBulkMigration,
  adminGetMigrationJobs,
  adminGetMigrationJob,
  adminTestMigrationDestination,
} from "@/api/admin";
import { card_className } from "./config";

type Phase = "idle" | "testing" | "tested" | "running" | "done" | "error";

interface ConnectionForm {
  imapHost: string;
  imapPort: string;
  encryption: "ssl" | "starttls" | "none";
  username: string;
  password: string;
}

const defaultForm: ConnectionForm = {
  imapHost: "",
  imapPort: "993",
  encryption: "ssl",
  username: "",
  password: "",
};

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
    completed:
      "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status]}`}
    >
      {status === "running" && (
        <Loader2 size={10} className="inline animate-spin mr-1" />
      )}
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

// ── Active job progress panel ─────────────────────────────────────────────────
function JobProgressPanel({
  job,
  onDismiss,
}: {
  job: MigrationJobRecord;
  onDismiss: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const overallPct = pct(job.copiedMessages, job.totalMessages);
  const isActive = job.status === "pending" || job.status === "running";

  return (
    <div
      className={`border rounded-xl p-4 text-sm space-y-3 ${
        job.status === "failed"
          ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10"
          : job.status === "completed"
            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10"
            : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive ? (
            <Loader2
              size={14}
              className="animate-spin text-blue-500 shrink-0"
            />
          ) : job.status === "completed" ? (
            <CheckCircle size={14} className="text-green-600 shrink-0" />
          ) : (
            <XCircle size={14} className="text-red-500 shrink-0" />
          )}
          <span className="font-semibold text-gray-800 dark:text-white">
            {isActive ? "Migration in progress…" : job.status === "completed" ? "Migration completed" : "Migration failed"}
          </span>
          <StatusBadge status={job.status} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {!isActive && (
            <button
              onClick={onDismiss}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Overall progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>
            {job.copiedMessages} / {job.totalMessages || "?"} messages copied
          </span>
          <span>{overallPct}%</span>
        </div>
        <ProgressBar value={overallPct} />
      </div>

      {/* Per-mailbox details */}
      {expanded && job.mailboxes.length > 0 && (
        <div className="space-y-2 pt-1">
          {job.mailboxes.map((mb) => {
            const p = pct(mb.copiedMessages, mb.totalMessages);
            return (
              <div
                key={mb.address}
                className="bg-white dark:bg-gray-800/50 rounded-lg p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                    {mb.address}
                  </span>
                  <StatusBadge status={mb.status} />
                </div>
                {mb.currentFolder && (
                  <p className="text-xs text-gray-400 truncate">
                    Folder: {mb.currentFolder}
                  </p>
                )}
                <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                  <span>
                    {mb.copiedMessages}/{mb.totalMessages || "?"} msgs
                    {mb.failedMessages > 0 && (
                      <span className="text-red-400 ml-1">
                        · {mb.failedMessages} failed
                      </span>
                    )}
                  </span>
                  <span>{p}%</span>
                </div>
                <ProgressBar value={p} />
                {mb.error && (
                  <p className="text-xs text-red-500">{mb.error}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 font-mono">
        Job: {job.jobId}
      </p>
    </div>
  );
}

// ── Migration history table ───────────────────────────────────────────────────
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
                    <span className="text-green-600 font-medium">
                      {job.copiedMessages}
                    </span>{" "}
                    /{" "}
                    {job.totalMessages || "?"} msgs
                    {job.failedMessages > 0 && (
                      <span className="text-red-400 ml-1">
                        · {job.failedMessages} failed
                      </span>
                    )}
                  </div>
                  {isOpen ? (
                    <ChevronUp size={14} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded mailbox rows */}
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
                      {mb.error && (
                        <p className="text-red-500">{mb.error}</p>
                      )}
                    </div>
                  ))}
                  {job.completedAt && (
                    <p className="text-xs text-gray-400">
                      Completed: {fmtDate(job.completedAt)}
                    </p>
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

// ── Main component ────────────────────────────────────────────────────────────
export default function MigrationTab() {
  const { domain } = useParams() as { domain: string };

  const [form, setForm] = useState<ConnectionForm>(defaultForm);
  const [phase, setPhase] = useState<Phase>("idle");
  const [testResult, setTestResult] = useState<{
    folderCount?: number;
    message?: string;
  } | null>(null);

  // Destination (mailcow) connectivity check
  const [dstTestState, setDstTestState] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [dstTestMsg, setDstTestMsg] = useState<string | null>(null);

  const [scope, setScope] = useState<"all" | "selected">("all");
  const [mailboxes, setMailboxes] = useState<string[]>([]);
  const [selectedMailboxes, setSelectedMailboxes] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [incremental, setIncremental] = useState(true);
  const [preserveFolders, setPreserveFolders] = useState(true);
  const [preserveFlags, setPreserveFlags] = useState(true);
  const [skipLarge, setSkipLarge] = useState(false);
  const [maxSizeMB, setMaxSizeMB] = useState("50");
  const [dryRun, setDryRun] = useState(false);

  // Active job tracking (single migration progress panel)
  const [activeJob, setActiveJob] = useState<MigrationJobRecord | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // History
  const [historyJobs, setHistoryJobs] = useState<MigrationJobRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // Polls the full history list until all jobs have settled
  const historyPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const set =
    (key: keyof ConnectionForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await adminGetMigrationJobs(domain);
      if (res?.success) setHistoryJobs(res.data || []);
    } finally {
      setHistoryLoading(false);
    }
  }, [domain]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // History poller: refreshes the list every 2.5s until no jobs are pending/running.
  // Used by both single and bulk migrations so the history table always stays live.
  const startHistoryPoll = useCallback(() => {
    if (historyPollRef.current) return; // already running
    historyPollRef.current = setInterval(async () => {
      try {
        const res = await adminGetMigrationJobs(domain);
        if (res?.success) {
          const jobs: MigrationJobRecord[] = res.data || [];
          setHistoryJobs(jobs);
          // Keep activeJob in sync if it's tracked via single-job polling
          setActiveJob((prev) => {
            if (!prev) return prev;
            return jobs.find((j) => j.jobId === prev.jobId) ?? prev;
          });
          const anyActive = jobs.some(
            (j) => j.status === "pending" || j.status === "running",
          );
          if (!anyActive) {
            clearInterval(historyPollRef.current!);
            historyPollRef.current = null;
          }
        }
      } catch {
        // ignore transient errors
      }
    }, 2500);
  }, [domain]);

  // Per-job poller for the single-migration progress panel
  const startPolling = useCallback(
    (jobId: string) => {
      if (pollRef.current) clearInterval(pollRef.current);
      startHistoryPoll(); // also keep history live
      pollRef.current = setInterval(async () => {
        try {
          const res = await adminGetMigrationJob(domain, jobId);
          if (res?.success && res.data) {
            setActiveJob(res.data);
            if (
              res.data.status === "completed" ||
              res.data.status === "failed"
            ) {
              clearInterval(pollRef.current!);
              pollRef.current = null;
              setPhase(res.data.status === "completed" ? "done" : "error");
            }
          }
        } catch {
          // ignore transient errors
        }
      }, 2500);
    },
    [domain, startHistoryPoll],
  );

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (historyPollRef.current) clearInterval(historyPollRef.current);
    };
  }, []);

  const handleTest = async () => {
    setPhase("testing");
    setTestResult(null);
    try {
      const res = await adminTestMigration(domain, {
        imapHost: form.imapHost,
        imapPort: parseInt(form.imapPort),
        encryption: form.encryption,
        username: form.username,
        password: form.password,
      });
      if (res?.success) {
        setTestResult({ folderCount: res.data?.folderCount, message: res.message });
        setPhase("tested");
      } else {
        setTestResult({ message: res?.message || "Connection failed" });
        setPhase("error");
      }
    } catch {
      setTestResult({ message: "Connection failed" });
      setPhase("error");
    }
  };

  const handleTestDestination = async () => {
    setDstTestState("testing");
    setDstTestMsg(null);
    try {
      const res = await adminTestMigrationDestination(domain);
      if (res?.success) {
        setDstTestState("ok");
        setDstTestMsg(res.message);
      } else {
        setDstTestState("error");
        setDstTestMsg(res?.message || "Destination unreachable");
      }
    } catch {
      setDstTestState("error");
      setDstTestMsg("Failed to reach destination server");
    }
  };

  const loadMailboxes = async () => {
    const res = await adminGetMailboxes(domain);
    if (res?.success) setMailboxes((res.data || []).map((m: any) => m.email));
  };

  const handleStart = async () => {
    setPhase("running");
    setActiveJob(null);
    try {
      const res = await adminStartMigration(domain, {
        imapHost: form.imapHost,
        imapPort: parseInt(form.imapPort),
        encryption: form.encryption,
        username: form.username,
        password: form.password,
        scope,
        selectedMailboxes,
        incremental,
        preserveFolders,
        preserveFlags,
        skipLarge,
        maxSizeMB: parseInt(maxSizeMB),
        dryRun,
      });
      if (res?.success) {
        if (res.dryRun) {
          setPhase("done");
          return;
        }
        const jobId = res.data?.jobId;
        if (jobId) {
          // Fetch initial state
          const jobRes = await adminGetMigrationJob(domain, jobId);
          if (jobRes?.success) setActiveJob(jobRes.data);
          startPolling(jobId);
        }
      } else {
        setPhase("error");
      }
    } catch {
      setPhase("error");
    }
  };

  const busy = phase === "testing" || phase === "running";

  // ── Bulk migration ────────────────────────────────────────────────────────
  const [bulkHost, setBulkHost] = useState("");
  const [bulkPort, setBulkPort] = useState("993");
  const [bulkEncryption, setBulkEncryption] = useState("ssl");
  const [accounts, setAccounts] = useState<BulkAccount[]>([
    { sourceEmail: "", sourcePassword: "" },
  ]);
  const [bulkPhase, setBulkPhase] = useState<
    "idle" | "running" | "done" | "error"
  >("idle");
  const [bulkJobs, setBulkJobs] = useState<BulkJob[]>([]);
  const [bulkSummary, setBulkSummary] = useState<{
    started: number;
    unmatched: number;
  } | null>(null);
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
    const validAccounts = accounts.filter(
      (a) => a.sourceEmail && a.sourcePassword,
    );
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
        setBulkSummary({
          started: res.data?.started,
          unmatched: res.data?.unmatched,
        });
        setBulkPhase("done");
        // Kick off the history poller so the table stays live until all jobs settle
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
      {/* Active job progress */}
      {activeJob && (
        <JobProgressPanel
          job={activeJob}
          onDismiss={() => setActiveJob(null)}
        />
      )}

      {/* Source Connection */}
      <div className={card_className}>
        <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-1">
          Source IMAP Server
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Credentials for the server you are migrating{" "}
          <strong>from</strong>. Emails will be copied into your mailboxes on
          this domain.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1 space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              IMAP Host
            </label>
            <Input
              placeholder="mail.example.com"
              value={form.imapHost}
              onChange={set("imapHost")}
              disabled={busy}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Port
            </label>
            <Input
              placeholder="993"
              value={form.imapPort}
              onChange={set("imapPort")}
              disabled={busy}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Encryption
            </label>
            <select
              value={form.encryption}
              onChange={set("encryption") as any}
              disabled={busy}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
            >
              <option value="ssl">SSL/TLS</option>
              <option value="starttls">STARTTLS</option>
              <option value="none">None</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Username
            </label>
            <Input
              placeholder="user@olddomain.com"
              value={form.username}
              onChange={set("username")}
              disabled={busy}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
              disabled={busy}
            />
          </div>
        </div>

        {testResult && (
          <div
            className={`mt-4 flex items-start gap-2 p-3 rounded-lg text-sm ${
              phase === "tested"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {phase === "tested" ? (
              <CheckCircle size={16} className="mt-0.5 shrink-0" />
            ) : (
              <XCircle size={16} className="mt-0.5 shrink-0" />
            )}
            <span>
              {phase === "tested"
                ? `Connected — ${testResult.folderCount} folder(s) found`
                : testResult.message}
            </span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            onClick={handleTest}
            disabled={busy || !form.imapHost || !form.username || !form.password}
            className="flex items-center gap-2"
          >
            {phase === "testing" ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Testing…
              </>
            ) : (
              <>
                <TestTube2 size={14} /> Test Source
              </>
            )}
          </Button>

          <button
            onClick={handleTestDestination}
            disabled={dstTestState === "testing"}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            {dstTestState === "testing" ? (
              <><Loader2 size={14} className="animate-spin" /> Testing destination…</>
            ) : (
              <><TestTube2 size={14} /> Test Destination (mailcow)</>
            )}
          </button>
        </div>

        {/* Destination test result */}
        {dstTestMsg && (
          <div className={`mt-3 flex items-start gap-2 p-3 rounded-lg text-sm ${
            dstTestState === "ok"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}>
            {dstTestState === "ok"
              ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
              : <XCircle size={16} className="mt-0.5 shrink-0" />}
            <span>{dstTestMsg}</span>
          </div>
        )}
      </div>

      {/* Migration Options */}
      <div className={card_className}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            Migration Options
          </h3>
          <button
            onClick={() => {
              setShowAdvanced((v) => !v);
              if (!showAdvanced) loadMailboxes();
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            {showAdvanced ? "Hide advanced" : "Show advanced"}
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Target mailboxes
              </label>
              <div className="flex gap-4">
                {(["all", "selected"] as const).map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="scope"
                      value={s}
                      checked={scope === s}
                      onChange={() => setScope(s)}
                      disabled={busy}
                    />
                    {s === "all"
                      ? "All mailboxes on this domain"
                      : "Select specific mailboxes"}
                  </label>
                ))}
              </div>
            </div>

            {scope === "selected" && mailboxes.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Choose mailboxes
                </label>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                  {mailboxes.map((mb) => (
                    <label
                      key={mb}
                      className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMailboxes.includes(mb)}
                        onChange={(e) =>
                          setSelectedMailboxes((prev) =>
                            e.target.checked
                              ? [...prev, mb]
                              : prev.filter((x) => x !== mb),
                          )
                        }
                        disabled={busy}
                      />
                      {mb}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                {
                  label: "Incremental (skip existing)",
                  state: incremental,
                  set: setIncremental,
                },
                {
                  label: "Preserve folder structure",
                  state: preserveFolders,
                  set: setPreserveFolders,
                },
                {
                  label: "Preserve read/flag status",
                  state: preserveFlags,
                  set: setPreserveFlags,
                },
                {
                  label: "Skip large messages",
                  state: skipLarge,
                  set: setSkipLarge,
                },
                {
                  label: "Dry run (no actual copy)",
                  state: dryRun,
                  set: setDryRun,
                },
              ].map(({ label, state, set: setter }) => (
                <label
                  key={label}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={state}
                    onChange={(e) => setter(e.target.checked)}
                    disabled={busy}
                  />
                  {label}
                </label>
              ))}
            </div>

            {skipLarge && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Max message size (MB)
                </label>
                <Input
                  type="number"
                  value={maxSizeMB}
                  onChange={(e) => setMaxSizeMB(e.target.value)}
                  disabled={busy}
                />
              </div>
            )}
          </div>
        )}

        {phase === "error" && !activeJob && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <XCircle size={16} className="shrink-0" />
            <span>Failed to start migration. Check your details and try again.</span>
          </div>
        )}

        <div className="mt-4">
          <Button
            onClick={handleStart}
            disabled={
              busy ||
              !form.imapHost ||
              !form.username ||
              !form.password
            }
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {phase === "running" ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Starting…
              </>
            ) : (
              <>
                <Play size={14} /> {dryRun ? "Dry Run" : "Start Migration"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 p-4 text-sm text-blue-700 dark:text-blue-300 space-y-1">
        <p className="font-semibold">How it works</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-600 dark:text-blue-400">
          <li>Connect to the source IMAP server with the credentials above.</li>
          <li>
            Copy all messages into the matching mailboxes on{" "}
            <strong>{domain}</strong>.
          </li>
          <li>
            Progress is tracked live — you can follow it in the panel above.
          </li>
          <li>Existing messages are skipped when incremental mode is on.</li>
        </ul>
      </div>

      {/* ── Bulk Migration ─────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center gap-2 mb-1">
          <Users size={16} className="text-gray-500" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            Bulk Migration
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Migrate multiple accounts at once. Each source account is matched to a
          mailbox on <strong>{domain}</strong> by its local part (e.g.{" "}
          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
            user@zoho.com
          </code>{" "}
          →{" "}
          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
            user@{domain}
          </code>
          ).
        </p>
      </div>

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
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Port
            </label>
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
                  onChange={(e) =>
                    updateAccount(i, "sourceEmail", e.target.value)
                  }
                  disabled={bulkBusy}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="password"
                  placeholder="Password"
                  value={acc.sourcePassword}
                  onChange={(e) =>
                    updateAccount(i, "sourcePassword", e.target.value)
                  }
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

        {/* Bulk results */}
        {bulkJobs.length > 0 && (
          <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div
              className={`px-3 py-2 text-xs font-medium flex items-center gap-2 ${
                bulkPhase === "done"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {bulkPhase === "done" ? (
                <CheckCircle size={13} />
              ) : (
                <XCircle size={13} />
              )}
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
                  <tr
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
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
            <XCircle size={14} /> Failed to start bulk migration. Check your
            server details and try again.
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
      <HistoryTable
        jobs={historyJobs}
        onRefresh={loadHistory}
        loading={historyLoading}
      />
    </div>
  );
}
