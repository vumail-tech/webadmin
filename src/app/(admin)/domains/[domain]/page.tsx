import { Metadata } from "next";
import DomainDetailView from "./domain-detail-view";

type Props = { params: Promise<{ domain: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain } = await params;
  const decoded = decodeURIComponent(domain);
  return {
    title: decoded,
    description: `Manage users, DNS records, aliases, sending rules, storage, and security settings for ${decoded}.`,
  };
}

export default async function DomainPage({ params }: Props) {
  await params;
  return <DomainDetailView />;
}
