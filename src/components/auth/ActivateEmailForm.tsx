"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";

import Button from "@/components/ui/button/Button";
import { authClient } from "@/lib/auth-client";
import { bumpToAdmin } from "@/api/users";
import { useAuthStore } from "@/stores/auth-store";

type State = "check-inbox" | "verifying" | "success" | "error";

export default function ActivateEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") ?? "";
  const router = useRouter();

  const { syncSession } = useAuthStore();
  const [state, setState] = useState<State>(token ? "verifying" : "check-inbox");
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // Auto-verify when token is present
  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      setState("verifying");
      try {
        const rs = await authClient.verifyEmail({ query: { token } });

        if (rs.error) {
          setError(rs.error.message || "This activation link is invalid or has expired.");
          setState("error");
          return;
        }

        // Bump role to admin now that email is confirmed
        await bumpToAdmin();

        // Refresh session so emailVerified updates in the store
        await syncSession();

        setState("success");
        setTimeout(() => router.replace("/signin"), 2500);
      } catch {
        setError("Something went wrong. Please try again.");
        setState("error");
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: `${window.location.origin}/activate`,
      });
      setResent(true);
    } catch {
      // fail silently — user can retry
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">

        {/* ── Check inbox ── */}
        {state === "check-inbox" && (
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-brand-50 dark:bg-brand-900/20">
              <Mail size={28} className="text-brand-500" />
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Check your email
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              We sent an activation link to
            </p>
            {email && (
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 mb-6">
                {decodeURIComponent(email)}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Click the link in the email to activate your account. Check your spam folder if you don&apos;t see it.
            </p>

            {resent ? (
              <p className="text-sm text-success-500 font-medium mb-4">
                Activation email resent!
              </p>
            ) : (
              <Button
                size="sm"
                className="w-full mb-4"
                onClick={handleResend}
                disabled={resending || !email}
              >
                {resending ? "Sending…" : "Resend activation email"}
              </Button>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Wrong account?{" "}
              <Link href="/signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                Sign up again
              </Link>
            </p>
          </div>
        )}

        {/* ── Verifying ── */}
        {state === "verifying" && (
          <div className="flex flex-col items-center gap-4 text-center py-6">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Activating your account…
            </p>
          </div>
        )}

        {/* ── Success ── */}
        {state === "success" && (
          <div className="flex flex-col items-center gap-4 text-center py-6">
            <CheckCircle2 size={48} className="text-success-500" />
            <div>
              <p className="font-semibold text-gray-800 dark:text-white/90">
                Account activated!
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Redirecting you to sign in…
              </p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {state === "error" && (
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 dark:bg-red-900/20">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90">
              Activation failed
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              {error}
            </p>
            <Button
              size="sm"
              className="w-full mb-4"
              onClick={handleResend}
              disabled={resending || !email}
            >
              {resending ? "Sending…" : "Request a new link"}
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                Back to sign in
              </Link>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
