import { Metadata } from "next";
import DomainsView from "./components/domains-view";

export const metadata: Metadata = {
  title: "Domains",
  description: "View and manage all your email domains, DNS records, mailboxes, and mail settings in one place.",
};

export default function DomainsPage() {
  return <DomainsView />;
}
