"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { adminGetSignature, adminSetSignature } from "@/api/admin";
import { Check, Copy } from "lucide-react";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
  mailboxId: string;
  mailboxEmail: string;
  mailboxName: string;
}

export function SignatureModal({
  isOpen,
  onClose,
  domain,
  mailboxId,
  mailboxEmail,
  mailboxName,
}: SignatureModalProps) {
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"visual" | "html">("visual");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const content = tab === "visual" ? html : text;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    if (!isOpen || !mailboxId) return;
    setLoading(true);
    adminGetSignature(domain, mailboxId)
      .then((rs: any) => {
        if (rs?.success) {
          setHtml(rs.data?.html || "");
          setText(rs.data?.text || "");
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen, domain, mailboxId]);

  // Keep plain-text in sync when HTML changes (strip tags for text version)
  const handleHtmlChange = (value: string) => {
    setHtml(value);
    setText(value.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminSetSignature(domain, mailboxId, { html, text });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const defaultTemplate = `<p><strong>${mailboxName}</strong><br/>${mailboxEmail}</p>`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold text-lg text-gray-800 dark:text-white">
            Email Signature
          </h2>
          <p className="text-sm text-gray-500 mt-1">{mailboxEmail}</p>
        </div>

        <p className="text-xs text-gray-500 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-lg px-3 py-2 leading-relaxed">
          Compose your signature here, then copy it into your mail client.
          In <strong>Gmail</strong>: Settings → See all settings → General → Signature.
          In <strong>Outlook</strong>: File → Options → Mail → Signatures.
          Use the HTML tab for rich-text clients; use Plain Text as a fallback.
        </p>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
        ) : (
          <>
            {/* Tab toggle */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
              {(["visual", "html"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    tab === t
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t === "visual" ? "HTML Editor" : "Plain Text"}
                </button>
              ))}
            </div>

            {tab === "visual" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    HTML Signature
                  </label>
                  {!html && (
                    <button
                      onClick={() => handleHtmlChange(defaultTemplate)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Use default template
                    </button>
                  )}
                </div>
                <textarea
                  value={html}
                  onChange={(e) => handleHtmlChange(e.target.value)}
                  rows={8}
                  placeholder={`<p><strong>${mailboxName}</strong><br/>${mailboxEmail}</p>`}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
                {html && (
                  <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
                    <p className="text-xs text-gray-400 mb-2">Preview</p>
                    <div
                      className="text-sm text-gray-700 dark:text-gray-300"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Plain Text Signature
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  placeholder={`${mailboxName}\n${mailboxEmail}`}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
                <p className="text-xs text-gray-400">
                  Auto-synced from HTML. You can override it here.
                </p>
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            disabled={!html && !text}
            className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
          >
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
          <Button onClick={handleSave} disabled={saving || loading} className="flex-1 gap-2">
            {saved ? <><Check size={14} /> Saved</> : saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
