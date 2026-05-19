"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { getDashboardStats } from "@/api/admin";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["#465FFF", "#9CB9FF", "#FF6B6B", "#FFA94D", "#34D399", "#A78BFA"];

interface MonthBucket { year: number; month: number; sent: number; received: number }

export function SentByDomainChart() {
  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());

  useEffect(() => {
    getDashboardStats()
      .then((rs) => {
        if (!rs?.success) return;
        const domains: { domain: string; sent: number; monthly: MonthBucket[] }[] = rs.data.domains || [];

        const currentYear = new Date().getFullYear();
        // Pick the year that has the most data across all domains
        const yearCounts = new Map<number, number>();
        for (const d of domains) {
          for (const b of d.monthly || []) {
            yearCounts.set(b.year, (yearCounts.get(b.year) || 0) + b.sent);
          }
        }
        const years = [...yearCounts.entries()].sort((a, b) => b[1] - a[1]);
        const year = years.length ? years[0][0] : currentYear;
        setDisplayYear(year);

        const chartSeries = domains
          .filter((d) => d.sent > 0 || d.monthly?.some((b) => b.sent > 0))
          .slice(0, 6)
          .map((d) => {
            const byMonth = new Map((d.monthly || []).filter((b) => b.year === year).map((b) => [b.month, b]));
            return {
              name: d.domain,
              data: MONTH_LABELS.map((_, i) => byMonth.get(i + 1)?.sent ?? 0),
            };
          });

        setSeries(chartSeries.length ? chartSeries : [{ name: "No data", data: MONTH_LABELS.map(() => 0) }]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const options: ApexOptions = {
    chart: {
      type: "line",
      height: 310,
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: COLORS,
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0 } },
    markers: { size: 0, hover: { size: 6 } },
    grid: { yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    xaxis: {
      type: "category",
      categories: MONTH_LABELS,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      min: 0,
      title: { text: "Sent Emails", style: { fontSize: "12px" } },
      labels: { style: { fontSize: "12px", colors: ["#6B7280"] } },
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      y: { formatter: (val: number) => `${val} emails` },
    },
    legend: { position: "top", horizontalAlign: "left" },
    dataLabels: { enabled: false },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-1 mb-6 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Sent by Domain</h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Monthly sending trends per domain — {displayYear}
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          {loading ? (
            <div className="h-[310px] flex items-center justify-center text-gray-400 text-sm">Loading chart…</div>
          ) : (
            <Chart options={options} series={series} type="area" height={310} />
          )}
        </div>
      </div>
    </div>
  );
}
