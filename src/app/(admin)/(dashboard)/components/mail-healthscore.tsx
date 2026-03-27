"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";
import { getDashboardStats } from "@/api/admin";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function MailHealthScore() {
  const [isOpen, setIsOpen] = useState(false);
  const [score, setScore] = useState(100);
  const [summary, setSummary] = useState({
    totalDomains: 0,
    totalSent: 0,
    totalRejected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const rs = await getDashboardStats();
        if (rs?.success) {
          setScore(rs.data.summary.avgHealthScore ?? 100);
          setSummary({
            totalDomains: rs.data.summary.totalDomains,
            totalSent: rs.data.summary.totalSent,
            totalRejected: rs.data.summary.totalRejected,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const scoreColor =
    score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  const options: ApexOptions = {
    colors: [scoreColor],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: { enabled: true },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: { size: "80%" },
        track: { background: "#E4E7EC", strokeWidth: "100%", margin: 5 },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: (val) => `${val}%`,
          },
        },
      },
    },
    fill: { type: "solid", colors: [scoreColor] },
    stroke: { lineCap: "round" },
  };

  const errorRate = summary.totalSent > 0
    ? ((summary.totalRejected / summary.totalSent) * 100).toFixed(1)
    : "0.0";

  const fmtNum = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Mail Health Score
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Average delivery health across all domains
            </p>
          </div>
          <div className="relative inline-block">
            <button onClick={() => setIsOpen(!isOpen)}>
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
            </button>
            <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-40 p-2">
              <DropdownItem onItemClick={() => setIsOpen(false)}>Refresh</DropdownItem>
            </Dropdown>
          </div>
        </div>

        <div className="relative">
          {loading ? (
            <div className="h-[330px] flex items-center justify-center text-gray-400 text-sm">
              Loading…
            </div>
          ) : (
            <ReactApexChart options={options} series={[score]} type="radialBar" height={330} />
          )}
          <span
            className={`absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full px-3 py-1 text-xs font-medium ${
              score >= 80
                ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                : score >= 50
                ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500"
                : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
            }`}
          >
            {score >= 80 ? "Good" : score >= 50 ? "Needs attention" : "Critical"}
          </span>
        </div>

        <p className="mx-auto mt-10 max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          {score >= 80
            ? "Mail delivery quality is healthy across your domains."
            : "Some domains may need attention to improve deliverability."}
        </p>
      </div>

      <div className="flex items-center justify-center gap-6 px-6 py-4">
        <Metric label="Domains" value={String(summary.totalDomains)} />
        <Divider />
        <Metric label="Sent (all time)" value={fmtNum(summary.totalSent)} />
        <Divider />
        <Metric label="Error rate" value={`${errorRate}%`} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-gray-800 dark:text-white/90">{value}</p>
    </div>
  );
}

function Divider() {
  return <div className="h-7 w-px bg-gray-200 dark:bg-gray-800" />;
}
