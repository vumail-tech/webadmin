"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useEffect, useState } from "react";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { getDashboardStats } from "@/api/admin";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface MonthBucket { year: number; month: number; sent: number; received: number; errors: number }

export function MonthlyMailActivityChart() {
  const [isOpen, setIsOpen] = useState(false);
  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([]);
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((rs) => {
        if (!rs?.success) return;
        const totals: MonthBucket[] = rs.data.monthlyTotals || [];

        const currentYear = new Date().getFullYear();
        const years = [...new Set(totals.map((b) => b.year))].sort((a, b) => b - a);
        const year = years.includes(currentYear) ? currentYear : (years[0] ?? currentYear);
        setDisplayYear(year);

        const byMonth = new Map(totals.filter((b) => b.year === year).map((b) => [b.month, b]));

        setSeries([
          { name: "Sent",     data: MONTH_LABELS.map((_, i) => byMonth.get(i + 1)?.sent     ?? 0) },
          { name: "Received", data: MONTH_LABELS.map((_, i) => byMonth.get(i + 1)?.received ?? 0) },
          { name: "Errors",   data: MONTH_LABELS.map((_, i) => byMonth.get(i + 1)?.errors   ?? 0) },
        ]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const options: ApexOptions = {
    colors: ["#465fff", "#22c55e", "#ef4444"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: "45%", borderRadius: 4, borderRadiusApplication: "end" },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories: MONTH_LABELS,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
    yaxis: {
      min: 0,
      labels: { formatter: (val: number) => Math.round(val).toString() },
    },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: { shared: true, intersect: false, y: { formatter: (val: number) => `${val} mails` } },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Monthly Mail Activity</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{displayYear}</p>
        </div>
        <div className="relative inline-block">
          <button onClick={() => setIsOpen(!isOpen)} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-40 p-2">
            <DropdownItem onItemClick={() => setIsOpen(false)}>View Details</DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          {loading ? (
            <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : (
            <ReactApexChart options={options} series={series} type="bar" height={180} />
          )}
        </div>
      </div>
    </div>
  );
}
