"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, PlusCircle } from "lucide-react";
import { getDashboardStats } from "@/api/admin";
import { Metrics } from "./metrics";
import { MonthlyMailActivityChart } from "./monthly-chart";
import { MailHealthScore } from "./mail-healthscore";
import { SentByDomainChart } from "./domain-sent";

export default function DashboardView() {
  const [totalDomains, setTotalDomains] = useState<number | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then((rs) => setTotalDomains(rs?.success ? rs.data.summary.totalDomains : 0))
      .catch(() => setTotalDomains(0));
  }, []);

  if (totalDomains === null) return null;

  if (totalDomains === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <Globe size={36} className="text-blue-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">No domains yet</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Add your first domain to start creating mailboxes and configuring email for your team.
          </p>
        </div>
        <Link
          href="/domains"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
        >
          <PlusCircle size={18} /> Add your first domain
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <Metrics />
        <MonthlyMailActivityChart />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <MailHealthScore />
      </div>
      <div className="col-span-12">
        <SentByDomainChart />
      </div>
    </div>
  );
}
