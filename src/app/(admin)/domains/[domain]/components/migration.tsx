"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Play, TestTube2, Plus, Trash2, Upload, Users } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { adminTestMigration, adminStartMigration, adminGetMailboxes, adminBulkMigration } from "@/api/admin";
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

function parseCsv(text: string): BulkAccount[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.toLowerCase().startsWith("source"))
    .map((line) => {
      const [sourceEmail, sourcePassword] = line.split(",").map((s) => s.trim());
      return { sourceEmail, sourcePassword };
    })
    .filter((a) => a.sourceEmail && a.sourcePassword);
}

export default function MigrationTab() {
  const { domain } = useParams() as { domain: string };

  const [form, setForm] = useState<ConnectionForm>(defaultForm);
  const [phase, setPhase] = useState<Phase>("idle");
  const [testResult, setTestResult] = useState<{ folderCount?: number; message?: string } | null>(null);
  const [jobResult, setJobResult] = useState<{ jobId?: string; targetCount?: number; message?: string } | null>(null);

  // Advanced options
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

  const set = (key: keyof ConnectionForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

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

  const loadMailboxes = async () => {
    const res = await adminGetMailboxes(domain);
    if (res?.success) setMailboxes((res.data || []).map((m: any) => m.email));
  };

  const handleStart = async () => {
    setPhase("running");
    setJobResult(null);
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
        setJobResult({ jobId: res.data?.jobId, targetCount: res.data?.targetCount, message: res.message });
        setPhase("done");
      } else {
        setJobResult({ message: res?.message || "Failed to start migration" });
        setPhase("error");
      }
    } catch {
      setJobResult({ message: "Failed to start migration" });
      setPhase("error");
    }
  };

  const busy = phase === "testing" || phase === "running";

  // ── Bulk migration state ──────────────────────────────────────────────────
  const [bulkHost, setBulkHost] = useState("");
  const [bulkPort, setBulkPort] = useState("993");
  const [bulkEncryption, setBulkEncryption] = useState("ssl");
  const [accounts, setAccounts] = useState<BulkAccount[]>([{ sourceEmail: "", sourcePassword: "" }]);
  const [bulkPhase, setBulkPhase] = useState<"idle" | "running" | "done" | "error">("idle");
  const [bulkJobs, setBulkJobs] = useState<BulkJob[]>([]);
  const [bulkSummary, setBulkSummary] = useState<{ started: number; unmatched: number } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const bulkBusy = bulkPhase === "running";

  const updateAccount = (i: number, field: keyof BulkAccount, value: string) =>
    setAccounts((prev) => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));

  const addRow = () => setAccounts((prev) => [...prev, { sourceEmail: "", sourcePassword: "" }]);

  const removeRow = (i: number) => setAccounts((prev) => prev.filter((_, idx) => idx !== i));

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
      } else {
        setBulkPhase("error");
      }
    } catch {
      setBulkPhase("error");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Source Connection */}
      <div className={card_className}>
        <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-1">Source IMAP Server</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Credentials for the server you are migrating <strong>from</strong>. Emails will be copied into your mailboxes on this domain.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1 space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">IMAP Host</label>
            <Input placeholder="mail.example.com" value={form.imapHost} onChange={set("imapHost")} disabled={busy} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Port</label>
            <Input placeholder="993" value={form.imapPort} onChange={set("imapPort")} disabled={busy} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Encryption</label>
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
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Username</label>
            <Input placeholder="user@olddomain.com" value={form.username} onChange={set("username")} disabled={busy} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Password</label>
            <Input type="password" placeholder="••••••••" value={form.password} onChange={set("password")} disabled={busy} />
          </div>
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`mt-4 flex items-start gap-2 p-3 rounded-lg text-sm ${
            phase === "tested"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}>
            {phase === "tested"
              ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
              : <XCircle size={16} className="mt-0.5 shrink-0" />}
            <span>
              {phase === "tested"
                ? `Connected — ${testResult.folderCount} folder(s) found`
                : testResult.message}
            </span>
          </div>
        )}

        <div className="mt-4">
          <Button
            onClick={handleTest}
            disabled={busy || !form.imapHost || !form.username || !form.password}
            className="flex items-center gap-2"
          >
            {phase === "testing" ? (
              <><Loader2 size={14} className="animate-spin" /> Testing…</>
            ) : (
              <><TestTube2 size={14} /> Test Connection</>
            )}
          </Button>
        </div>
      </div>

      {/* Migration Options */}
      <div className={card_className}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">Migration Options</h3>
          <button
            onClick={() => { setShowAdvanced((v) => !v); if (!showAdvanced) loadMailboxes(); }}
            className="text-xs text-blue-600 hover:underline"
          >
            {showAdvanced ? "Hide advanced" : "Show advanced"}
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-4">
            {/* Scope */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Target mailboxes</label>
              <div className="flex gap-4">
                {(["all", "selected"] as const).map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      value={s}
                      checked={scope === s}
                      onChange={() => setScope(s)}
                      disabled={busy}
                    />
                    {s === "all" ? "All mailboxes on this domain" : "Select specific mailboxes"}
                  </label>
                ))}
              </div>
            </div>

            {scope === "selected" && mailboxes.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Choose mailboxes</label>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                  {mailboxes.map((mb) => (
                    <label key={mb} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input
                        type="checkbox"
                        checked={selectedMailboxes.includes(mb)}
                        onChange={(e) =>
                          setSelectedMailboxes((prev) =>
                            e.target.checked ? [...prev, mb] : prev.filter((x) => x !== mb)
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

            {/* Flags */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Incremental (skip existing)", state: incremental, set: setIncremental },
                { label: "Preserve folder structure", state: preserveFolders, set: setPreserveFolders },
                { label: "Preserve read/flag status", state: preserveFlags, set: setPreserveFlags },
                { label: "Skip large messages", state: skipLarge, set: setSkipLarge },
                { label: "Dry run (no actual copy)", state: dryRun, set: setDryRun },
              ].map(({ label, state, set: setter }) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={state} onChange={(e) => setter(e.target.checked)} disabled={busy} />
                  {label}
                </label>
              ))}
            </div>

            {skipLarge && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Max message size (MB)</label>
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

        {/* Job result */}
        {jobResult && (
          <div className={`mt-4 flex items-start gap-2 p-3 rounded-lg text-sm ${
            phase === "done"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}>
            {phase === "done"
              ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
              : <XCircle size={16} className="mt-0.5 shrink-0" />}
            <div>
              {phase === "done" ? (
                <>
                  <p>Migration started for {jobResult.targetCount} mailbox(es).</p>
                  {jobResult.jobId && (
                    <p className="mt-1 font-mono text-xs opacity-70">Job: {jobResult.jobId}</p>
                  )}
                </>
              ) : (
                <p>{jobResult.message}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-4">
          <Button
            onClick={handleStart}
            disabled={busy || phase === "done" || !form.imapHost || !form.username || !form.password}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {phase === "running" ? (
              <><Loader2 size={14} className="animate-spin" /> Starting…</>
            ) : (
              <><Play size={14} /> {dryRun ? "Dry Run" : "Start Migration"}</>
            )}
          </Button>
          {phase !== "tested" && phase !== "idle" && phase !== "error" && phase !== "done" && (
            <p className="mt-2 text-xs text-gray-400">Test the connection first to verify credentials.</p>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 p-4 text-sm text-blue-700 dark:text-blue-300 space-y-1">
        <p className="font-semibold">How it works</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-600 dark:text-blue-400">
          <li>Connect to the source IMAP server with the credentials above.</li>
          <li>Copy all messages into the matching mailboxes on <strong>{domain}</strong>.</li>
          <li>Migration runs in the background — you can close this page safely.</li>
          <li>Existing messages are skipped when incremental mode is on.</li>
        </ul>
      </div>

      {/* ── Bulk Migration ─────────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center gap-2 mb-1">
          <Users size={16} className="text-gray-500" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">Bulk Migration</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Migrate multiple accounts at once. Each source account is matched to a mailbox on <strong>{domain}</strong> by its local part (e.g. <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">user@zoho.com</code> → <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">user@{domain}</code>).
        </p>
      </div>

      {/* Bulk source server */}
      <div className={card_className}>
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Source Server</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1 space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">IMAP Host</label>
            <Input placeholder="imap.zoho.com" value={bulkHost} onChange={(e) => setBulkHost(e.target.value)} disabled={bulkBusy} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Port</label>
            <Input placeholder="993" value={bulkPort} onChange={(e) => setBulkPort(e.target.value)} disabled={bulkBusy} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Encryption</label>
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
            Accounts <span className="text-gray-400 font-normal">({accounts.filter((a) => a.sourceEmail).length})</span>
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
          CSV format: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">source_email,source_password</code> — one account per line, no header required.
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
            <div className={`px-3 py-2 text-xs font-medium flex items-center gap-2 ${
              bulkPhase === "done"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}>
              {bulkPhase === "done" ? <CheckCircle size={13} /> : <XCircle size={13} />}
              {bulkSummary && `${bulkSummary.started} started · ${bulkSummary.unmatched} unmatched`}
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
                    <td className="px-3 py-2 font-mono text-gray-400">{job.targetEmail ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${
                        job.status === "started"
                          ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                      }`}>
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
            <XCircle size={14} /> Failed to start bulk migration. Check your server details and try again.
          </div>
        )}

        <div className="mt-4">
          <Button
            onClick={handleBulkStart}
            disabled={bulkBusy || bulkPhase === "done" || !bulkHost || !accounts.some((a) => a.sourceEmail && a.sourcePassword)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {bulkBusy ? (
              <><Loader2 size={14} className="animate-spin" /> Starting…</>
            ) : (
              <><Play size={14} /> Start Bulk Migration</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
