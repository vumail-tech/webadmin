import { Metadata } from "next";
import MarketingView from "./components/marketing-view";

export const metadata: Metadata = {
  title: "Marketing Email",
  description: "Create and send marketing campaigns, manage contact lists, and design email templates.",
};

export default function MarketingPage() {
  return <MarketingView />;
}
