"use client";
import dynamic from "next/dynamic";
import { MailHealthRadial } from "./mail-health";
import { ApexOptions } from "apexcharts";
import { card_className } from "./config";
import { Send, Inbox, AlertTriangle, Clock, XCircle } from "lucide-react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MonthlyBucket {
  year: number;
  month: number; // 1–12
  sent: number;
  received: number;
  deferred: number;
  rejected: number;
}

interface Metrics {
  sent?: number;
  received?: number;
  deferred?: number;
  rejected?: number;
  spamRejected?: number;
  healthScore?: number;
  healthLabel?: string;
  healthBreakdown?: {
    sentPct?: number;
    deferredPct?: number;
    rejectedPct?: number;
  };
  periodStart?: string;
  periodEnd?: string;
  monthly?: MonthlyBucket[];
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function StatCard({
  icon: Icon,
  label,
  value,
  color = "blue",
}: {
  icon: any;
  label: string;
  value: number;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };
  return (
    <div className={card_className}>
      <div className={`inline-flex p-2 rounded-lg mb-3 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value.toLocaleString()}</p>
    </div>
  );
}

export const DomainOverview = ({ metrics }: { metrics: Metrics | null }) => {
  const m = metrics || {};

  // Build bar chart from real monthly data stored in metrics.monthly.
  // Show current year; fall back to the years present in the data if none match.
  const currentYear = new Date().getFullYear();
  const monthly = m.monthly ?? [];

  // Determine which year to display: prefer current year, else the latest year in data
  const yearsInData = [...new Set(monthly.map((b) => b.year))].sort((a, b) => b - a);
  const displayYear = yearsInData.includes(currentYear) ? currentYear : (yearsInData[0] ?? currentYear);

  const byMonth = new Map(
    monthly.filter((b) => b.year === displayYear).map((b) => [b.month, b])
  );

  const chartCategories = MONTH_LABELS.map((lbl, i) => `${lbl} ${displayYear}`);
  const distributedSent = MONTH_LABELS.map((_, i) => byMonth.get(i + 1)?.sent ?? 0);
  const distributedReceived = MONTH_LABELS.map((_, i) => byMonth.get(i + 1)?.received ?? 0);

  const hasChartData = distributedSent.some((v) => v > 0) || distributedReceived.some((v) => v > 0);

  const barOptions: ApexOptions = {
    chart: { type: "bar", height: 280, toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
    colors: ["#465FFF", "#9CB9FF"],
    plotOptions: { bar: { horizontal: false, columnWidth: "40%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: { categories: chartCategories, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { title: { text: "Emails" }, min: 0 },
    legend: { show: true, position: "top", horizontalAlign: "left" },
    grid: { yaxis: { lines: { show: true } } },
    tooltip: { y: { formatter: (v) => `${v} emails` } },
  };

  const barSeries = [
    { name: "Sent", data: distributedSent },
    { name: "Received", data: distributedReceived },
  ];

  // Delivery breakdown donut
  const total = (m.sent ?? 0) + (m.deferred ?? 0) + (m.rejected ?? 0);
  const donutSeries = total > 0
    ? [m.sent ?? 0, m.deferred ?? 0, m.rejected ?? 0]
    : [1, 0, 0];

  const donutOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "Outfit, sans-serif" },
    labels: ["Delivered", "Deferred", "Rejected"],
    colors: ["#22c55e", "#f59e0b", "#ef4444"],
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "70%" } } },
    tooltip: { y: { formatter: (v) => `${v} emails` } },
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={Send} label="Sent" value={m.sent ?? 0} color="blue" />
        <StatCard icon={Inbox} label="Received" value={m.received ?? 0} color="green" />
        <StatCard icon={Clock} label="Deferred" value={m.deferred ?? 0} color="yellow" />
        <StatCard icon={XCircle} label="Rejected" value={m.rejected ?? 0} color="red" />
        <StatCard icon={AlertTriangle} label="Spam" value={m.spamRejected ?? 0} color="purple" />
      </div>

      {/* Health Score + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${card_className} flex flex-col items-center`}>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Mail Health Score</p>
          <MailHealthRadial score={m.healthScore ?? 100} />
          <span
            className={`mt-2 text-xs font-medium capitalize px-2 py-1 rounded-full ${
              (m.healthScore ?? 100) >= 80
                ? "bg-green-100 text-green-700"
                : (m.healthScore ?? 100) >= 50
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {m.healthLabel ?? "excellent"}
          </span>
        </div>

        <div className={`${card_className} lg:col-span-2`}>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Delivery Breakdown
          </h3>
          <ReactApexChart options={donutOptions} series={donutSeries} type="donut" height={220} />
        </div>
      </div>

      {/* Sent/Received Bar Chart */}
      <div className={card_className}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Sent &amp; Received — Monthly Distribution
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">{displayYear}</span>
        </div>
        {hasChartData ? (
          <ReactApexChart options={barOptions} series={barSeries} type="bar" height={280} />
        ) : (
          <div className="flex items-center justify-center h-[280px] text-gray-400 dark:text-gray-600 text-sm">
            No mail traffic data yet for {displayYear}
          </div>
        )}
      </div>
    </div>
  );
};
