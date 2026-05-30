import { Metadata } from "next";
import BillingView from "./components/billing-view";

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage per-domain subscriptions, plans, and payment history.",
};

export default function BillingPage() {
  return <BillingView />;
}
