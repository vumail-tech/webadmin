"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, Save, ShieldCheck, ShieldAlert } from "lucide-react";
import { adminGetSecurity, adminUpdateSecurity } from "@/api/admin";
import { card_className } from "./config";
import { Section, Toggle, Select } from "./utils";
import Button from "@/components/ui/button/Button";

export default function SecurityTab() {
  const { domain } = useParams() as { domain: string };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [spamLevel, setSpamLevel] = useState("medium");
  const [blockExecutables, setBlockExecutables] = useState(false);
  const [quarantine, setQuarantine] = useState(true);
  const [allowExternal, setAllowExternal] = useState(false);
  const [enforceTls, setEnforceTls] = useState(false);

  // DNS verification status
  const [dnsStatus, setDnsStatus] = useState({
    mxVerified: false,
    spfVerified: false,
    dkimVerified: false,
  });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const rs = await adminGetSecurity(domain);
        if (rs?.success) {
          const { spamFilter, forwarding, tls, dnsVerification } = rs.data;
          setSpamLevel(spamFilter?.level || "medium");
          setBlockExecutables(spamFilter?.blockExecutables ?? false);
          setQuarantine(spamFilter?.quarantine ?? true);
          setAllowExternal(forwarding?.allowExternal ?? false);
          setEnforceTls(tls?.enforce ?? false);
          setDnsStatus(dnsVerification || { mxVerified: false, spfVerified: false, dkimVerified: false });
        }
      } finally {
        setLoading(false);
      }
    };
    if (domain) fetch();
  }, [domain]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpdateSecurity(domain, {
        spamFilter: { level: spamLevel, blockExecutables, quarantine },
        forwarding: { allowExternal },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><RefreshCw size={20} className="animate-spin text-gray-400" /></div>;
  }

  const dnsChecks = [
    { label: "MX Record", verified: dnsStatus.mxVerified },
    { label: "SPF Record", verified: dnsStatus.spfVerified },
    { label: "DKIM Record", verified: dnsStatus.dkimVerified },
  ];

  return (
    <div className="space-y-6">
      {/* DNS Verification Overview */}
      <div className={card_className}>
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">DNS Verification Status</h3>
        <div className="grid grid-cols-3 gap-4">
          {dnsChecks.map(({ label, verified }) => (
            <div
              key={label}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                verified
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                  : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              }`}
            >
              {verified ? (
                <ShieldCheck size={18} className="text-green-600 shrink-0" />
              ) : (
                <ShieldAlert size={18} className="text-red-500 shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{label}</p>
                <p className={`text-xs ${verified ? "text-green-600" : "text-red-500"}`}>
                  {verified ? "Verified" : "Not verified"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Section title="Spam Protection">
        <Select
          label="Spam Filter Level"
          value={spamLevel}
          onChange={setSpamLevel}
          options={[
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
          ]}
        />
        <Toggle label="Block executable attachments (.exe, .bat, etc.)" checked={blockExecutables} onChange={setBlockExecutables} />
        <Toggle label="Quarantine spam instead of rejecting" checked={quarantine} onChange={setQuarantine} />
      </Section>

      <Section title="Forwarding">
        <Toggle label="Allow external forwarding" checked={allowExternal} onChange={setAllowExternal} />
      </Section>

      <Section title="Transport Security">
        <Toggle label="Enforce TLS for outbound mail" checked={enforceTls} onChange={setEnforceTls} />
      </Section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving…</> : saved ? "✓ Saved" : <><Save size={14} /> Save Settings</>}
        </Button>
      </div>
    </div>
  );
}
