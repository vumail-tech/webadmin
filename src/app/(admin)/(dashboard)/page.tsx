import { Metadata } from "next";
import DashboardView from "./components/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Monitor your email domains, delivery metrics, mail health scores, and sending activity at a glance.",
};

export default function Dashboard() {
  return <DashboardView />;
}
