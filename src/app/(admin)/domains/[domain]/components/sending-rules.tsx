"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, Save } from "lucide-react";
import { adminGetSendingRules, adminUpdateSendingRules } from "@/api/admin";
import { card_className } from "./config";
import { Section, Toggle, Select } from "./utils";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";

export default function SendingRules() {
  const { domain } = useParams() as { domain: string };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // DKIM
  const [dkimEnabled, setDkimEnabled] = useState(false);
  const [dkimSelector, setDkimSelector] = useState("dkim");
  const [keyLength, setKeyLength] = useState("2048");
  const [publicKey, setPublicKey] = useState("");
  const [regenerateDkim, setRegenerateDkim] = useState(false);

  // Policy
  const [rejectSpam, setRejectSpam] = useState(true);
  const [spamGreylist, setSpamGreylist] = useState(false);
  const [maxMessageSize, setMaxMessageSize] = useState("25");
  const [allowPlaintext, setAllowPlaintext] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      setLoading(true);
      try {
        const rs = await adminGetSendingRules(domain);
        if (rs?.success) {
          const { dkim, policy } = rs.data;
          setDkimEnabled(dkim?.enabled ?? false);
          setDkimSelector(dkim?.selector || "dkim");
          setKeyLength(String(dkim?.keyLength || 2048));
          setPublicKey(dkim?.publicKey || "");
          setRejectSpam(policy?.rejectSpam ?? true);
          setSpamGreylist(policy?.spamGreylist ?? false);
          setMaxMessageSize(String(policy?.maxMessageSize || 25));
          setAllowPlaintext(policy?.allowPlaintext ?? true);
        }
      } finally {
        setLoading(false);
      }
    };
    if (domain) fetchRules();
  }, [domain]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpdateSendingRules(domain, {
        rejectSpam,
        maxMessageSize: parseInt(maxMessageSize),
        regenerateDkim,
        dkimSelector,
        keyLength: parseInt(keyLength),
      });
      setSaved(true);
      setRegenerateDkim(false);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-gray-400">
        <RefreshCw size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section title="DKIM Signing">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dkimEnabled ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              DKIM is currently <strong>{dkimEnabled ? "enabled" : "disabled"}</strong>
            </span>
          </div>

          {publicKey && (
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Public Key (TXT record value)</label>
              <textarea
                readOnly
                value={publicKey}
                rows={3}
                className="w-full text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-gray-600 dark:text-gray-300"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-700 dark:text-gray-300">Selector</label>
              <Input value={dkimSelector} onChange={(e) => setDkimSelector(e.target.value)} />
            </div>
            <Select
              label="Key Length"
              value={keyLength}
              onChange={setKeyLength}
              options={[
                { label: "1024 bits", value: "1024" },
                { label: "2048 bits (recommended)", value: "2048" },
                { label: "4096 bits", value: "4096" },
              ]}
            />
          </div>

          <Toggle
            label="Regenerate DKIM key on save"
            checked={regenerateDkim}
            onChange={setRegenerateDkim}
          />
        </div>
      </Section>

      <Section title="Outbound Policy">
        <div className="space-y-4">
          <Toggle label="Reject incoming spam" checked={rejectSpam} onChange={setRejectSpam} />
          <Toggle label="Enable greylisting" checked={spamGreylist} onChange={setSpamGreylist} />
          <Toggle label="Allow plaintext AUTH" checked={allowPlaintext} onChange={setAllowPlaintext} />

          <div className="space-y-1">
            <label className="text-sm text-gray-700 dark:text-gray-300">Max message size (MB)</label>
            <Input
              type="number"
              value={maxMessageSize}
              onChange={(e) => setMaxMessageSize(e.target.value)}
              placeholder="25"
            />
          </div>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <><RefreshCw size={14} className="animate-spin" /> Saving…</>
          ) : saved ? (
            "✓ Saved"
          ) : (
            <><Save size={14} /> Save Rules</>
          )}
        </Button>
      </div>
    </div>
  );
}
