"use client";

import Link from "next/link";
import { CreditCard, ArrowRight } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import { card_className } from "./config";

type SubStatus = "trialing" | "active" | "past_due" | "suspended" | "canceled";

export interface DomainBilling {
  subscription: {
    status: SubStatus;
    planKey?: string;
    trialEndsAt?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  } | null;
  plan?: { name: string; price?: number; currency: string; includedMailboxes: number } | null;
  invoices?: any[];
  mailboxCount?: number;
}

const STATUS_COLOR: Record<SubStatus, "success" | "warning" | "error" | "info" | "light"> = {
  active: "success",
  trialing: "info",
  past_due: "warning",
  suspended: "error",
  canceled: "light",
};

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

/** Plan & subscription summary shown on the domain Overview tab. */
export function DomainBillingCard({ billing }: { billing: DomainBilling | null }) {
  const sub = billing?.subscription;

  return (
    <div className={card_className}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <CreditCard size={18} />
          </span>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Subscription</p>
            <p className="font-semibold text-gray-800 dark:text-white">
              {billing?.plan?.name ?? (sub ? "No plan selected" : "Not subscribed")}
            </p>
          </div>
        </div>
        {sub && <Badge color={STATUS_COLOR[sub.status]}>{sub.status.replace("_", " ")}</Badge>}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {billing?.plan && (
          <>
            <div>
              <dt className="text-gray-400">Price</dt>
              <dd className="text-gray-700 dark:text-gray-300">
                {billing.plan.currency} {(billing.plan.price ?? 0).toLocaleString()}/yr
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Mailboxes</dt>
              <dd className="text-gray-700 dark:text-gray-300">
                {billing.mailboxCount ?? 0} / {billing.plan.includedMailboxes}
              </dd>
            </div>
          </>
        )}
        {sub && (
          <div>
            <dt className="text-gray-400">
              {sub.status === "trialing" ? "Trial ends" : "Renews"}
            </dt>
            <dd className="text-gray-700 dark:text-gray-300">
              {fmtDate(sub.status === "trialing" ? sub.trialEndsAt : sub.currentPeriodEnd)}
            </dd>
          </div>
        )}
      </dl>

      <Link
        href="/billing"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Manage billing <ArrowRight size={14} />
      </Link>
    </div>
  );
}

/** Daily-countdown calc for banners. */
export function daysLeft(d?: string) {
  if (!d) return 0;
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
}
