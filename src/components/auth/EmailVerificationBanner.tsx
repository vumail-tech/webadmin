"use client";
import { useState } from "react";
import { MailWarning, X, CheckCircle2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/auth-store";

export default function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.emailVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: `${window.location.origin}/activate`,
      });
      setSent(true);
    } catch {
      // fail silently
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-yellow-50 border-b border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 text-sm">
      <MailWarning size={16} className="shrink-0 text-yellow-600 dark:text-yellow-400" />

      <p className="flex-1 text-yellow-800 dark:text-yellow-300">
        Your email address is not verified. Please check your inbox for the activation link.
      </p>

      {sent ? (
        <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 shrink-0">
          <CheckCircle2 size={13} />
          Sent!
        </span>
      ) : (
        <button
          onClick={handleResend}
          disabled={sending}
          className="shrink-0 text-xs font-medium text-yellow-700 dark:text-yellow-300 underline underline-offset-2 hover:text-yellow-900 dark:hover:text-yellow-100 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Resend email"}
        </button>
      )}

      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-200"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
