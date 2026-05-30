"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

/**
 * Paystack redirects here after checkout with ?reference=... . The actual
 * activation happens server-side via the webhook; this page just confirms the
 * payment was submitted and points the user back to billing.
 */
export default function BillingCallbackPage() {
  const params = useSearchParams();
  const reference = params.get("reference") || params.get("trxref");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Give the webhook a moment to land, then show the success state.
    const t = setTimeout(() => setDone(true), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-gray-200 p-8 text-center dark:border-gray-700">
        {!done ? (
          <>
            <Loader2 className="mx-auto mb-4 animate-spin text-blue-600" size={36} />
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              Confirming your payment…
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This only takes a moment.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto mb-4 text-green-500" size={40} />
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              Payment submitted
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {reference ? (
                <>
                  Reference <span className="font-mono">{reference}</span>.{" "}
                </>
              ) : null}
              Your subscription will activate as soon as Paystack confirms the charge.
            </p>
            <div className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-400">
              <Clock size={13} /> Activation is usually instant.
            </div>
            <Link
              href="/billing"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Back to billing
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
