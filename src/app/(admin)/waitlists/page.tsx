import { Metadata } from "next";
import WaitlistsView from "./components/waitlists-view";

export const metadata: Metadata = {
  title: "Waitlists",
  description: "Collect waitlist signups via a public API and email them later.",
};

export default function WaitlistsPage() {
  return <WaitlistsView />;
}
