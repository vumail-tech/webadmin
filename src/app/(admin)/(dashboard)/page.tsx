import type { Metadata } from "next";

import { Metrics } from "./components/metrics";
import { MonthlyMailActivityChart } from "./components/monthly-chart";
import { MailHealthScore } from "./components/mail-healthscore";
import { SentByDomainChart } from "./components/domain-sent";

export const metadata: Metadata = {
  title:
    "Dashboard",
};

export default function Dashboard() {
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
