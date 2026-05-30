"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, CreditCard } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import {
  adminGetBillingOverview,
  adminGetInvoices,
  adminCancelSubscription,
} from "@/api/admin";
import PlanPickerModal from "./plan-picker-modal";

type SubStatus = "trialing" | "active" | "past_due" | "suspended" | "canceled";

interface Subscription {
  _id: string;
  domain: string;
  planKey?: string;
  status: SubStatus;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  mailboxCount: number;
  plan?: {
    name: string;
    price?: number;
    currency: string;
    includedMailboxes: number;
  } | null;
}

interface Invoice {
  _id: string;
  domain: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: string;
  createdAt: string;
}

const STATUS_COLOR: Record<SubStatus, "success" | "warning" | "error" | "info" | "light"> = {
  active: "success",
  trialing: "info",
  past_due: "warning",
  suspended: "error",
  canceled: "light",
};

function fmtPrice(plan?: Subscription["plan"]) {
  if (typeof plan?.price !== "number") return "—";
  return `${plan.currency ?? "KES"} ${plan.price.toLocaleString()}/yr`;
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export default function BillingView() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState<{ domain: string; planKey?: string | null } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [ov, inv] = await Promise.all([
      adminGetBillingOverview(),
      adminGetInvoices(),
    ]);
    if (ov?.success) setSubs(ov.data);
    if (inv?.success) setInvoices(inv.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (domain: string) => {
    if (!confirm(`Cancel the subscription for ${domain} at the end of the period?`)) return;
    await adminCancelSubscription(domain);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Billing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage per-domain subscriptions and payment history.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Subscriptions */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-800 dark:text-white">Subscriptions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/40 text-left text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3 font-medium">Domain</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Mailboxes</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Renews / Trial ends</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading && subs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    Loading…
                  </td>
                </tr>
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    No subscriptions yet. Create a domain to start a trial.
                  </td>
                </tr>
              ) : (
                subs.map((s) => (
                  <tr key={s._id} className="text-gray-700 dark:text-gray-300">
                    <td className="px-5 py-3 font-medium">
                      <Link href={`/domains/${s.domain}`} className="hover:text-blue-600">
                        {s.domain}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{s.plan?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      {s.mailboxCount}
                      {s.plan ? ` / ${s.plan.includedMailboxes}` : ""}
                    </td>
                    <td className="px-5 py-3">
                      {fmtPrice(s.plan)}
                    </td>
                    <td className="px-5 py-3">
                      {s.status === "trialing" ? fmtDate(s.trialEndsAt) : fmtDate(s.currentPeriodEnd)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge color={STATUS_COLOR[s.status]}>{s.status.replace("_", " ")}</Badge>
                      {s.cancelAtPeriodEnd && (
                        <span className="ml-2 text-xs text-gray-400">(cancels)</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setPicker({ domain: s.domain, planKey: s.planKey })}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          {s.status === "active" ? "Change plan" : "Subscribe"}
                        </button>
                        {["active", "trialing", "past_due"].includes(s.status) &&
                          !s.cancelAtPeriodEnd && (
                            <button
                              onClick={() => cancel(s.domain)}
                              className="rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                              Cancel
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <CreditCard size={16} className="text-gray-400" />
          <h2 className="font-semibold text-gray-800 dark:text-white">Payment history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/40 text-left text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Domain</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                    No payments yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="text-gray-700 dark:text-gray-300">
                    <td className="px-5 py-3">{fmtDate(inv.paidAt ?? inv.createdAt)}</td>
                    <td className="px-5 py-3">{inv.domain}</td>
                    <td className="px-5 py-3">
                      {inv.currency} {inv.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <Badge color={inv.status === "paid" ? "success" : inv.status === "failed" ? "error" : "warning"}>
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {picker && (
        <PlanPickerModal
          isOpen={!!picker}
          domain={picker.domain}
          currentPlanKey={picker.planKey}
          onClose={() => {
            setPicker(null);
            load();
          }}
        />
      )}
    </div>
  );
}
