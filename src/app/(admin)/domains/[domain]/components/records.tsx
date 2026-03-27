"use client";

import { CheckCircle, Copy, XCircle } from "lucide-react";
import { card_className } from "./config";

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
}: {
  records: RecordsData | null;
}) {
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
