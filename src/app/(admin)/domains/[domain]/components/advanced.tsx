"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, Save } from "lucide-react";
import { adminGetAdvanced, adminUpdateAdvanced } from "@/api/admin";
import { Section, Toggle, Select } from "./utils";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";

export default function AdvancedTab() {
  const { domain } = useParams() as { domain: string };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [autoReply, setAutoReply] = useState(false);
  const [retentionPolicy, setRetentionPolicy] = useState("never");
  const [relayEnabled, setRelayEnabled] = useState(false);
  const [relayHost, setRelayHost] = useState("");
  const [relayPort, setRelayPort] = useState("587");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const rs = await adminGetAdvanced(domain);
        if (rs?.success) {
          const d = rs.data;
          setAutoReply(d.autoReply?.enabled ?? false);
          setRetentionPolicy(d.retentionPolicy || "never");
          setRelayEnabled(d.relay?.enabled ?? false);
          setRelayHost(d.relay?.host || "");
          setRelayPort(String(d.relay?.port || 587));
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
      await adminUpdateAdvanced(domain, {
        autoReply: { enabled: autoReply },
        retentionPolicy,
        relay: { enabled: relayEnabled, host: relayHost, port: parseInt(relayPort) },
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

  return (
    <div className="space-y-6">
      <Section title="Auto Replies">
        <Toggle label="Enable domain-wide auto-reply" checked={autoReply} onChange={setAutoReply} />
      </Section>

      <Section title="Retention Policy">
        <Select
          label="Delete mails after"
          value={retentionPolicy}
          onChange={setRetentionPolicy}
          options={[
            { label: "Never", value: "never" },
            { label: "30 days", value: "30" },
            { label: "90 days", value: "90" },
            { label: "1 year", value: "365" },
          ]}
        />
      </Section>

      <Section title="SMTP Relay">
        <Toggle label="Enable custom relay host" checked={relayEnabled} onChange={setRelayEnabled} />
        {relayEnabled && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Relay Host</label>
              <Input placeholder="smtp.relay.com" value={relayHost} onChange={(e) => setRelayHost(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Port</label>
              <Input type="number" placeholder="587" value={relayPort} onChange={(e) => setRelayPort(e.target.value)} />
            </div>
          </div>
        )}
      </Section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving…</> : saved ? "✓ Saved" : <><Save size={14} /> Save Settings</>}
        </Button>
      </div>
    </div>
  );
}
