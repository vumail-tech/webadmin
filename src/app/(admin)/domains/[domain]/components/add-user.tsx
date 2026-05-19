"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { adminCreateMailbox, adminGetMailSettings } from "@/api/admin";
import { Check, Copy, Download } from "lucide-react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddUserModal({
  isOpen,
  onClose,
}: AddUserModalProps) {
  const router = useRouter();
  const params = useParams();
  const domain = params?.domain as string;

  const [localPart, setLocalPart] = useState("");
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [stage, setStage] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [generatedPassword, setGeneratedPassword] = useState("");
  const [mailboxId, setMailboxId] = useState<string | null>(null);
  const [copied, setCopied] = useState<"email" | "password" | "instructions" | null>(null);
  const [mailHost, setMailHost] = useState("");


  const isValidLocalPart = (value: string) =>
    /^[a-z0-9._-]+$/i.test(value.trim());

  const handleSubmit = async () => {
    const cleanLocalPart = localPart.trim().toLowerCase();

    if (!cleanLocalPart) { setError("Email username is required"); return; }
    if (!isValidLocalPart(cleanLocalPart)) { setError("Only letters, numbers, dots and dashes allowed"); return; }
    if (!name.trim()) { setError("Full name is required"); return; }

    try {
      setLoading(true);
      setError(null);

      const rs = await adminCreateMailbox(domain, {
        localPart: cleanLocalPart,
        name: name.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });

      if (!rs.success) {
        setError(rs.message);
      } else {
        setGeneratedPassword(rs.data.generatedPassword);
        setMailboxId(rs.data.mailbox._id);
        const settings = await adminGetMailSettings();
        if (settings?.success) setMailHost(settings.data.host);
        setStage(1);
        router.refresh();
      }
    } catch {
      setError("Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadConfig = () => {
    if (!mailboxId) return;
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/domains/${domain}/mailboxes/${mailboxId}/mobileconfig`;
    window.open(url, "_blank");
  };

  const buildInstructions = () => {
    const email = `${localPart}@${domain}`;
    const host = mailHost || "mail.yourdomain.com";
    return `Hi ${name},

Your email account is ready. Here are your login credentials and setup instructions — please keep them safe.

─────────────────────────────
  EMAIL:    ${email}
  PASSWORD: ${generatedPassword}
─────────────────────────────

━━━ GMAIL APP (Android / iOS) ━━━
1. Open Gmail → tap your profile picture → "Add another account"
2. Choose "Other" at the bottom
3. Enter your email address, tap Next
4. Choose IMAP
5. Enter your password when prompted

   Incoming (IMAP)
   Server:   ${host}
   Port:     993
   Security: SSL/TLS

   Outgoing (SMTP)
   Server:   ${host}
   Port:     587
   Security: STARTTLS
   Username: ${email}
   Password: (same as above)

━━━ OUTLOOK (Desktop / Mobile) ━━━
1. Go to File → Add Account (desktop) or tap + (mobile)
2. Enter your email and tap "Advanced setup"
3. Choose IMAP
4. Use the same server settings above

━━━ iOS (Apple Mail) ━━━
Use the configuration profile link provided by your admin for automatic setup.

─────────────────────────────
If you have any issues, contact your administrator.`;
  };

  const copyToClipboard = async (
    value: string,
    type: "email" | "password" | "instructions"
  ) => {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      {
        stage === 0  ? (
          <div className="space-y-4 w-full">
            <h2 className="font-semibold text-gray-800 dark:text-white/90 text-sm lg:text-lg">
              Add Mailbox
            </h2>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-800 dark:text-white/90">
                Email address
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="info"
                  onChange={(e) => setLocalPart(e.target.value)}
                />
                <span className="text-sm text-gray-500">@{domain}</span>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-800 dark:text-white/90">
                Full name
              </label>
              <Input
                type="text"
                placeholder="John Doe"
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-800 dark:text-white/90">
                Tags (optional)
              </label>
              <Input
                type="text"
                placeholder="sales, support"
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-muted"
              >
                Cancel
              </button>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-lg hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Creating…" : "Add user"}
              </Button>
            </div>
          </div>
        ): null
      }
      {stage === 1 ? (
        <div className="space-y-6 w-full text-center">
          {/* Success animation (simple + clean) */}
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl">
              ✓
            </div>
          </div>

          <h2 className="font-semibold text-gray-800 dark:text-white/90 text-lg">
            Mailbox created
          </h2>

          <p className="text-sm text-gray-500">
            Copy the credentials below and share them securely with the user.
          </p>

          {/* Email */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Email address
            </label>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted">
              <div className="flex-1  text-sm ">
                {localPart}@{domain}
              </div>
              <button
                onClick={() =>
                  copyToClipboard(`${localPart}@${domain}`, "email")
                }
                disabled={copied === "email"}
                className="p-2 rounded-lg hover:bg-muted"
                title="Copy email"
              >
                {copied === "email" ? <Check className=" text-green-600" />: <Copy />}
              </button>
            </div>

          </div>

          {/* Password */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Password
            </label>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted">
              <div className="flex-1  text-sm font-mono ">
                {generatedPassword}
              </div>
              <button
                onClick={() =>
                  copyToClipboard(generatedPassword, "password")
                }
                disabled={copied === "password"}
                className="p-2 rounded-lg hover:bg-muted"
                title="Copy password"
              >
                {copied === "password" ? <Check className=" text-green-600" /> : <Copy />}
              </button>
            </div>

          </div>

          {/* Setup instructions */}
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Setup instructions (copy &amp; send to user)
              </label>
              <button
                onClick={() => copyToClipboard(buildInstructions(), "instructions")}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                {copied === "instructions" ? (
                  <><Check size={12} className="text-green-600" /> Copied</>
                ) : (
                  <><Copy size={12} /> Copy text</>
                )}
              </button>
            </div>
            <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-3 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono leading-relaxed">
              {buildInstructions()}
            </pre>
          </div>

          {/* Download config (iOS) */}
          <button
            onClick={handleDownloadConfig}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <Download size={14} />
            Download iOS Config (.mobileconfig)
          </button>

          {/* Close */}
          <Button
            onClick={() => {
              setStage(0);
              setLocalPart("");
              setName("");
              setTags("");
              setGeneratedPassword("");
              setMailboxId(null);
              setCopied(null);
              setMailHost("");
              onClose();
            }}
            className="w-full"
          >
            Done
          </Button>
        </div>
      ) : null}

    </Modal>
  );
}
