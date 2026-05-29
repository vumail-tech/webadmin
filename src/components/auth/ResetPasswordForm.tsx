"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!token) {
      setError("Invalid or missing reset token. Please request a new reset link.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const rs = await authClient.resetPassword({ newPassword, token });

      if (rs.error) {
        setError(rs.error.message || "Failed to reset password. The link may have expired.");
      } else {
        setDone(true);
        setTimeout(() => router.replace("/signin"), 3000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter a new password for your account.
            </p>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle2 size={48} className="text-success-500" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-white/90">
                  Password updated
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your password has been reset. Redirecting you to sign in…
                </p>
              </div>
              <Link
                href="/signin"
                className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              {!token && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle size={16} className="shrink-0" />
                  Invalid or expired reset link.{" "}
                  <Link href="/forgot-password" className="underline underline-offset-2">
                    Request a new one
                  </Link>
                  .
                </div>
              )}

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <Label>
                      New Password <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="At least 8 characters"
                        disabled={!token || loading}
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label>
                      Confirm Password <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Re-enter your password"
                        disabled={!token || loading}
                      />
                      <span
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
                      </span>
                    </div>
                  </div>

                  <Button className="w-full" size="sm" disabled={!token || loading}>
                    {loading ? "Updating…" : "Set New Password"}
                  </Button>
                </div>
              </form>

              <div className="mt-5">
                <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                  Remember your password?{" "}
                  <Link
                    href="/signin"
                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
