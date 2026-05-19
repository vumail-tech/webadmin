import { Metadata } from "next";
import TransactionalView from "./components/transactional-view";

export const metadata: Metadata = {
  title: "Transactional Email",
  description: "Generate and manage per-domain API keys to send transactional emails via the VuMail REST API.",
};

export default function TransactionalPage() {
  return <TransactionalView />;
}
