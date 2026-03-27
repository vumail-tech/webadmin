"use client";
import { useEffect, useState } from "react";
import { Globe, Mail, Send, ShieldAlert } from "lucide-react";
import { MetricsCard } from "./metrics-card";
import { getDashboardStats } from "@/api/admin";

export const Metrics = () => {
  const [data, setData] = useState({
    totalDomains: 0,
    totalMailboxes: 0,
    totalSent: 0,
    totalRejected: 0,
    activeDomains: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const rs = await getDashboardStats();
        if (rs?.success) {
          setData({
            totalDomains: rs.data.summary.totalDomains,
            totalMailboxes: rs.data.summary.totalMailboxes,
            totalSent: rs.data.summary.totalSent,
            totalRejected: rs.data.summary.totalRejected,
            activeDomains: rs.data.summary.activeDomains,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      <MetricsCard
        Icon={Globe}
        title="Active Domains"
        value={loading ? 0 : data.activeDomains}
        subtitle={`${data.totalDomains} total`}
      />
      <MetricsCard
        Icon={Mail}
        title="Total Mailboxes"
        value={loading ? 0 : data.totalMailboxes}
      />
      <MetricsCard
        Icon={Send}
        title="Emails Sent"
        value={loading ? 0 : data.totalSent}
        subtitle="All time"
      />
      <MetricsCard
        Icon={ShieldAlert}
        title="Rejected"
        value={loading ? 0 : data.totalRejected}
        subtitle="All time"
      />
    </div>
  );
};
