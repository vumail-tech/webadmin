"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { adminGetPlans, adminSubscribeDomain } from "@/api/admin";

interface Plan {
  _id: string;
  key: string;
  name: string;
  description?: string;
  currency: string;
  price: number;
  includedMailboxes: number;
}

export default function PlanPickerModal({
  isOpen,
  domain,
  currentPlanKey,
  onClose,
}: {
  isOpen: boolean;
  domain: string;
  currentPlanKey?: string | null;
  onClose: () => void;
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      const res = await adminGetPlans();
      if (res?.success) setPlans(res.data);
      setLoading(false);
    })();
  }, [isOpen]);

  const subscribe = async (planKey: string) => {
    setSubmitting(planKey);
    setError(null);
    const res = await adminSubscribeDomain(domain, planKey);
    if (res?.success && res.data?.authorizationUrl) {
      window.location.href = res.data.authorizationUrl;
      return;
    }
    setError(res?.message || "Could not start checkout. Try again.");
    setSubmitting(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Choose a plan for {domain}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Per-mailbox pricing, billed annually via Paystack.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.key === currentPlanKey;
              return (
                <div
                  key={plan._id}
                  className="flex flex-col rounded-2xl border border-gray-200 p-5 dark:border-gray-700"
                >
                  <h3 className="font-semibold text-gray-800 dark:text-white">{plan.name}</h3>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {plan.currency} {(plan.price ?? 0).toLocaleString()}
                    <span className="text-sm font-normal text-gray-400">/yr</span>
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400 flex-1">
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      {plan.includedMailboxes} mailboxes
                    </li>
                    {plan.description && <li className="text-xs">{plan.description}</li>}
                  </ul>
                  <button
                    disabled={submitting !== null || isCurrent}
                    onClick={() => subscribe(plan.key)}
                    className="mt-5 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isCurrent
                      ? "Current plan"
                      : submitting === plan.key
                        ? "Redirecting…"
                        : "Subscribe"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
