"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MailHealthRadialProps {
  score: number;
}

export function MailHealthRadial({ score }: MailHealthRadialProps) {
  const options: ApexOptions = {
    chart: {
      type: "radialBar",
      sparkline: { enabled: true },
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#465FFF"],
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: "70%" },
        track: { background: "#E4E7EC", strokeWidth: "100%", margin: 5 },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "24px",
            fontWeight: "600",
            formatter: (val) => `${val}%`,
            color: "#1D2939",
          },
        },
      },
    },
    stroke: { lineCap: "round" },
    labels: ["Health Score"],
  };

  return <ReactApexChart options={options} series={[score]} type="radialBar" height={120} />;
}
