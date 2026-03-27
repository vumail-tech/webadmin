"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, Save, CheckCircle, XCircle, Play, Wifi } from "lucide-react";
import { adminGetAdvanced, adminUpdateAdvanced, adminTestMigration, adminStartMigration } from "@/api/admin";
import { Section, Toggle, Select } from "./utils";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";

type MigrationStatus = "idle" | "testing" | "test_ok" | "test_fail" | "running" | "started";

export default function AdvancedTab() {
  const { domain } = useParams() as { domain: string };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Advanced settings
  const [autoReply, setAutoReply] = useState(false);
  const [retentionPolicy, setRetentionPolicy] = useState("never");
  const [relayEnabled, setRelayEnabled] = useState(false);
  const [relayHost, setRelayHost] = useState("");
  const [relayPort, setRelayPort] = useState("587");

  // Migration form
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [encryption, setEncryption] = useState("ssl");
  const [migUser, setMigUser] = useState("");
  const [migPass, setMigPass] = useState("");
  const [scope, setScope] = useState("all");
  const [incremental, setIncremental] = useState(true);
  const [preserveFolders, setPreserveFolders] = useState(true);
  const [preserveFlags, setPreserveFlags] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [skipLarge, setSkipLarge] = useState(false);

  const [migStatus, setMigStatus] = useState<MigrationStatus>("idle");
  const [migMessage, setMigMessage] = useState("");

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

  const migrationPayload = () => ({
    imapHost, imapPort: parseInt(imapPort), encryption,
    username: migUser, password: migPass,
    scope, incremental, preserveFolders, preserveFlags, dryRun, skipLarge,
  });

  const handleTestConnection = async () => {
    if (!imapHost || !migUser || !migPass) {
      setMigMessage("Host, username and password are required.");
      setMigStatus("test_fail");
      return;
    }
    setMigStatus("testing");
    setMigMessage("");
    try {
      const rs = await adminTestMigration(domain, migrationPayload());
      if (rs?.success) {
        setMigStatus("test_ok");
        setMigMessage(`Connected. Found ${rs.data?.folderCount ?? 0} folder(s).`);
      } else {
        setMigStatus("test_fail");
        setMigMessage(rs?.message || "Connection failed");
      }
    } catch {
      setMigStatus("test_fail");
      setMigMessage("Connection error");
    }
  };

  const handleStartMigration = async () => {
    setMigStatus("running");
    setMigMessage("");
    try {
      const rs = await adminStartMigration(domain, migrationPayload());
      if (rs?.success) {
        setMigStatus("started");
        setMigMessage(rs.message || `Migration started. Job ID: ${rs.data?.jobId}`);
      } else {
        setMigStatus("test_fail");
        setMigMessage(rs?.message || "Failed to start migration");
      }
    } catch {
      setMigStatus("test_fail");
      setMigMessage("Migration failed to start");
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

      {/* Mail Migration */}
      <Section title="Mail Migration">
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
          Import mailboxes from another IMAP server into this domain.
        </p>

        <div className="space-y-4 mt-2">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Source Server</h4>
          <Input placeholder="mail.oldserver.com" value={imapHost} onChange={(e) => setImapHost(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="993" type="number" value={imapPort} onChange={(e) => setImapPort(e.target.value)} />
            <Select
              label="Encryption"
              value={encryption}
              onChange={setEncryption}
              options={[
                { label: "SSL/TLS", value: "ssl" },
                { label: "STARTTLS", value: "starttls" },
                { label: "None", value: "none" },
              ]}
            />
          </div>
          <Input placeholder="admin@olddomain.com" value={migUser} onChange={(e) => setMigUser(e.target.value)} />
          <Input type="password" placeholder="Password" value={migPass} onChange={(e) => setMigPass(e.target.value)} />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Migration Scope</h4>
          <Select
            label="What to migrate"
            value={scope}
            onChange={setScope}
            options={[
              { label: "All mailboxes in this domain", value: "all" },
              { label: "Specific mailboxes only", value: "selected" },
            ]}
          />
          <Switch label="Incremental sync (recommended)" checked={incremental} onChange={setIncremental} />
          <Switch label="Preserve folder structure" checked={preserveFolders} onChange={setPreserveFolders} />
          <Switch label="Preserve read/unread status" checked={preserveFlags} onChange={setPreserveFlags} />
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Safety</h4>
          <Switch label="Dry run (test connection only)" checked={dryRun} onChange={setDryRun} />
          <Switch label="Skip emails larger than 50MB" checked={skipLarge} onChange={setSkipLarge} />
        </div>

        {/* Status Message */}
        {migMessage && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            migStatus === "test_ok" || migStatus === "started"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : migStatus === "test_fail"
              ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
              : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          }`}>
            {migStatus === "test_ok" || migStatus === "started" ? (
              <CheckCircle size={16} />
            ) : migStatus === "test_fail" ? (
              <XCircle size={16} />
            ) : (
              <RefreshCw size={16} className="animate-spin" />
            )}
            {migMessage}
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={migStatus === "testing" || migStatus === "running"}
            className="flex items-center gap-2"
          >
            <Wifi size={14} />
            {migStatus === "testing" ? "Testing…" : "Test Connection"}
          </Button>
          <Button
            onClick={handleStartMigration}
            disabled={migStatus === "testing" || migStatus === "running" || migStatus === "started"}
            className="flex items-center gap-2"
          >
            <Play size={14} />
            {migStatus === "running" ? "Starting…" : migStatus === "started" ? "Migration Started" : "Start Migration"}
          </Button>
        </div>
      </Section>
    </div>
  );
}
