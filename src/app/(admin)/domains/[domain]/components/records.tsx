"use client";

import { useState } from "react";
import { CheckCircle, Copy, XCircle, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { card_className } from "./config";
import { adminVerifyDomainDNS } from "@/api/admin";
import { useParams } from "next/navigation";

type RecordsData = {
  domain: string;
  mx?: any[];
  autodiscover?: any[];
  spf?: any;
  dkim?: any;
  dmarc?: any;
  auth?: { mxOk: boolean; spfOk: boolean; dkimOk: boolean; dmarcOk: boolean };
  deliverability?: {
    ip: string | null;
    ptr: string | null;
    ptrOk: boolean;
    blacklists: { zone: string; listed: boolean }[];
  };
};

const isVerified = (source?: string) => source === "verified";
const isMissing = (source?: string) => source === "missing";
const isDerived = (source?: string) => source === "derived";

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

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const rs = await adminVerifyDomainDNS(domain);
      const failed = rs?.status === "fail" || (!rs?.success && !rs?.verified);
      const message = rs?.message || rs?.error || (failed ? "Verification failed." : "Verified.");
      setVerifyResult({ success: !!rs?.success && !!rs?.verified, message });
      if (rs?.success && rs?.verified) onVerified?.();
    } catch {
      setVerifyResult({ success: false, message: "An error occurred during verification." });
    } finally {
      setVerifying(false);
    }
  };

  if (!records) return null;

  const mxRecords =
    records.mx?.map((r) => ({
      type: r.type, host: r.host, value: r.value, priority: r.priority, source: r.source,
    })) ?? [];

  const autodiscoverRecords =
    records.autodiscover?.map((r) => ({
      type: r.type, host: r.host, value: r.value, priority: r.priority, source: r.source,
    })) ?? [];

  const spfRecords = records.spf
    ? [{ type: records.spf.type, host: records.spf.host, value: records.spf.value, source: records.spf.source }]
    : [];

  const dkimRecords = records.dkim
    ? [{ type: records.dkim.type, host: records.dkim.host, value: records.dkim.value, source: records.dkim.source }]
    : [];

  const dmarcRecords = records.dmarc
    ? [{ type: records.dmarc.type, host: records.dmarc.host, value: records.dmarc.value, source: records.dmarc.source }]
    : [];

  const auth = records.auth;
  const deliverability = records.deliverability;
  const missingAuth = auth && (!auth.spfOk || !auth.dkimOk);
  const hasBlacklisted = deliverability?.blacklists.some((b) => b.listed);

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
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle size={16} />
          <span>DNS verified — domain is active.</span>
        </div>
      )}

      {/* PTR warning — shown on active domains with missing reverse DNS */}
      {domainStatus === "ACTIVE" && deliverability && !deliverability.ptrOk && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-900/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-sm text-orange-800 dark:text-orange-300">
                Reverse DNS (PTR) not configured
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                Your mail server IP{deliverability.ip ? ` (${deliverability.ip})` : ""} has no reverse DNS record.
                Gmail, Outlook, and others use this as a spam signal. Contact your VPS/hosting provider
                and set the PTR/reverse DNS for this IP to match your mail server hostname.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Spam warning — shown on active domains with missing auth records */}
      {domainStatus === "ACTIVE" && missingAuth && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/10 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-sm text-red-800 dark:text-red-300">
                Outgoing emails will likely go to spam
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                {[!auth?.spfOk && "SPF", !auth?.dkimOk && "DKIM"]
                  .filter(Boolean)
                  .join(" and ")}{" "}
                {(!auth?.spfOk && !auth?.dkimOk) ? "records are" : "record is"} missing from DNS.
                Add {(!auth?.spfOk && !auth?.dkimOk) ? "them" : "it"} using the values below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Email authentication summary */}
      {auth && (
        <div className={card_className}>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
            Email Authentication
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(
              [
                { label: "MX", ok: auth.mxOk, desc: "Mail delivery" },
                { label: "SPF", ok: auth.spfOk, desc: "Sender policy" },
                { label: "DKIM", ok: auth.dkimOk, desc: "Mail signing" },
                { label: "DMARC", ok: auth.dmarcOk, desc: "Spoofing protection" },
              ] as const
            ).map(({ label, ok, desc }) => (
              <div
                key={label}
                className={`rounded-xl p-3 text-center border ${
                  ok
                    ? "border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/10"
                    : "border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/10"
                }`}
              >
                <div className="flex justify-center mb-1">
                  {ok ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <XCircle size={18} className="text-red-500" />
                  )}
                </div>
                <p className={`text-sm font-bold ${ok ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                  {label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mail server deliverability */}
      {deliverability && (
        <div className={card_className}>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
            Mail Server Deliverability
          </h4>

          {/* PTR row */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
              <div className="text-sm">
                <p className="text-gray-800 dark:text-white/90 font-medium">
                  Reverse DNS (PTR)
                  {deliverability.ip && (
                    <span className="ml-2 text-xs text-gray-500 font-mono">{deliverability.ip}</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {deliverability.ptrOk
                    ? `Resolves to ${deliverability.ptr}`
                    : deliverability.ptr
                    ? `Resolves to ${deliverability.ptr} — expected mail server hostname`
                    : deliverability.ip
                    ? "No PTR record — set reverse DNS at your hosting provider"
                    : "Could not resolve mail server IP"}
                </p>
                {!deliverability.ptrOk && deliverability.ip && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    Missing PTR is a common cause of emails going to spam. Contact your VPS/hosting provider to set reverse DNS for {deliverability.ip} to match your mail server hostname.
                  </p>
                )}
              </div>
              <div className="shrink-0 ml-3">
                {deliverability.ptrOk ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <XCircle size={16} className="text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Blacklist checks */}
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Blacklist Checks
          </p>
          <div className="grid grid-cols-2 gap-2">
            {deliverability.blacklists.map(({ zone, listed }) => (
              <div
                key={zone}
                className={`flex items-center justify-between rounded-lg px-3 py-2 border text-xs ${
                  listed
                    ? "border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/10"
                    : "border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/10"
                }`}
              >
                <span className={`font-mono ${listed ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>
                  {zone}
                </span>
                {listed ? (
                  <XCircle size={14} className="text-red-500 shrink-0" />
                ) : (
                  <CheckCircle size={14} className="text-green-500 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {hasBlacklisted && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              Your mail server IP is listed on one or more blacklists. Submit a delisting request to each affected blacklist.
            </div>
          )}
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
        <h4 className="font-semibold text-gray-800 dark:text-white/90">{title}</h4>
        <p className="text-sm text-gray-700 dark:text-gray-500">{description}</p>
      </div>

      <div className="space-y-3">
        {records.map((r, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800 gap-3"
          >
            <div className="text-sm min-w-0">
              <p className="text-gray-800 dark:text-white/90">
                <strong>{r.type}</strong>{" "}
                <span className="font-mono text-xs text-gray-500">{r.host}</span>
              </p>
              <p className="break-all text-gray-700 dark:text-gray-500 mt-0.5">{r.value}</p>
              {r.priority !== undefined && (
                <p className="text-xs text-gray-500 mt-0.5">Priority: {r.priority}</p>
              )}
              {isMissing(r.source) && (
                <p className="text-xs text-red-500 mt-1 font-medium">Not found in DNS — add this record</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isVerified(r.source) && <CheckCircle className="text-green-500" size={16} />}
              {isMissing(r.source) && <XCircle className="text-red-500" size={16} />}
              {isDerived(r.source) && <span className="w-4" />}
              <button
                onClick={() => navigator.clipboard.writeText(r.value)}
                className="text-gray-400 hover:text-gray-600"
                title="Copy value"
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
