"use client";

import { useState } from "react";
import { CheckCircle, Copy, XCircle, ShieldCheck, Loader2, AlertTriangle, Zap } from "lucide-react";
import { card_className } from "./config";
import { adminVerifyDomainDNS, adminConfigureCloudflare } from "@/api/admin";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import { useParams } from "next/navigation";

type RecordsData = {
  domain: string;
  mx?: any[];
  autodiscover?: any[];
  spf?: any;
  dkim?: any;
  dmarc?: any;
};

const isValidSource = (source?: string) =>
  source === "derived" || source === "mailcow";

export default function RecordsTab({
  records,
  domainStatus,
  onVerified,
}: {
  records: RecordsData | null;
  domainStatus?: string;
  onVerified?: () => void;
}) {
  const domain = useParams().domain as string;
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);

  const [showCloudflare, setShowCloudflare] = useState(false);
  const [cfToken, setCfToken] = useState("");
  const [cfZoneId, setCfZoneId] = useState("");
  const [cfLoading, setCfLoading] = useState(false);
  const [cfResult, setCfResult] = useState<{ success: boolean; results: any[] } | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const rs = await adminVerifyDomainDNS(domain);
      setVerifyResult({ success: !!rs?.success && rs.verified, message: rs?.message || "Verification failed" });
      if (rs?.success && rs.verified) onVerified?.();
    } catch {
      setVerifyResult({ success: false, message: "An error occurred during verification." });
    } finally {
      setVerifying(false);
    }
  };

  if (!records) return null;

  const mxRecords =
    records.mx?.map((r) => ({
      type: r.type,
      host: r.host,
      value: r.value,
      priority: r.priority,
      valid: isValidSource(r.source),
    })) ?? [];

  const autodiscoverRecords =
    records.autodiscover?.map((r) => ({
      type: r.type,
      host: r.host,
      value: r.value,
      priority: r.priority,
      valid: isValidSource(r.source),
    })) ?? [];

  const spfRecords = records.spf
    ? [
        {
          type: records.spf.type,
          host: records.spf.host,
          value: records.spf.value,
          valid: isValidSource(records.spf.source),
        },
      ]
    : [];

  const dkimRecords = records.dkim
    ? [
        {
          type: records.dkim.type,
          host: records.dkim.host,
          value: records.dkim.value,
          valid: isValidSource(records.dkim.source),
        },
      ]
    : [];

  const dmarcRecords = records.dmarc
    ? [
        {
          type: records.dmarc.type,
          host: records.dmarc.host,
          value: records.dmarc.value,
          valid: isValidSource(records.dmarc.source),
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Verification banner */}
      {domainStatus !== "ACTIVE" ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-900/10 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-sm text-yellow-800 dark:text-yellow-300">DNS not verified</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Add all the records below to your DNS provider, then click Verify to activate your domain.
              </p>
            </div>
          </div>
          {verifyResult && (
            <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
              verifyResult.success
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}>
              {verifyResult.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {verifyResult.message}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {verifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              {verifying ? "Checking DNS…" : "Verify DNS Records"}
            </button>
            <button
              onClick={() => setShowCloudflare(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
            >
              <Zap size={14} /> Auto-configure with Cloudflare
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle size={16} />
          <span>DNS verified — domain is active.</span>
        </div>
      )}

      <DNSRecord
        title="MX Records"
        description="Controls where incoming mail is delivered"
        records={mxRecords}
      />

      <DNSRecord
        title="Autodiscover & Autoconfig"
        description="Enables automatic email client configuration"
        records={autodiscoverRecords}
      />

      <DNSRecord
        title="SPF Record"
        description="Authorizes sending mail servers"
        records={spfRecords}
      />

      <DNSRecord
        title="DKIM Record"
        description="Signs outgoing emails"
        records={dkimRecords}
      />

      <DNSRecord
        title="DMARC Record"
        description="Protects your domain from spoofing"
        records={dmarcRecords}
      />

      {/* Cloudflare auto-configure modal */}
      <Modal isOpen={showCloudflare} onClose={() => { setShowCloudflare(false); setCfResult(null); }} className="max-w-md">
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-white">Auto-configure DNS via Cloudflare</h2>
            <p className="text-sm text-gray-500 mt-1">
              Paste your Cloudflare API token and Zone ID. All required DNS records will be created automatically.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">API Token</label>
              <Input
                type="password"
                placeholder="Your Cloudflare API token"
                value={cfToken}
                onChange={(e) => setCfToken(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Zone ID</label>
              <Input
                type="text"
                placeholder="e.g. abc123def456..."
                value={cfZoneId}
                onChange={(e) => setCfZoneId(e.target.value)}
              />
              <p className="text-xs text-gray-400">Found in your Cloudflare domain overview page.</p>
            </div>
          </div>

          {cfResult && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {cfResult.results.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2">
                  <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">{r.record}</span>
                  {r.status === "error"
                    ? <span className="text-red-500 text-xs">{r.error || "Error"}</span>
                    : <CheckCircle size={14} className="text-green-500" />
                  }
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setShowCloudflare(false); setCfResult(null); }}
              className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {cfResult ? "Close" : "Cancel"}
            </button>
            {!cfResult && (
              <button
                onClick={async () => {
                  if (!cfToken || !cfZoneId) return;
                  setCfLoading(true);
                  try {
                    const rs = await adminConfigureCloudflare(domain, { apiToken: cfToken, zoneId: cfZoneId });
                    setCfResult(rs);
                  } finally {
                    setCfLoading(false);
                  }
                }}
                disabled={cfLoading || !cfToken || !cfZoneId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-60"
              >
                {cfLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {cfLoading ? "Configuring…" : "Configure DNS"}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DNSRecord({
  title,
  description,
  records,
}: {
  title: string;
  description: string;
  records: any[];
}) {
  if (!records.length) return null;

  return (
    <div className={card_className}>
      <div className="mb-4">
        <h4 className="font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-500">
          {description}
        </p>
      </div>

      <div className="space-y-3">
        {records.map((r, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
          >
            <div className="text-sm">
              <p className="text-gray-800 dark:text-white/90">
                <strong>{r.type}</strong> {r.host}
              </p>
              <p className="break-all text-gray-700 dark:text-gray-500">
                {r.value}
              </p>
              {r.priority !== undefined && (
                <p className="text-xs text-gray-500">
                  Priority: {r.priority}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {r.valid ? (
                <CheckCircle className="text-green-500" size={18} />
              ) : (
                <XCircle className="text-red-500" size={18} />
              )}
              <button
                onClick={() => navigator.clipboard.writeText(r.value)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
