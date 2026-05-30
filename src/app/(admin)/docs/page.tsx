import { Metadata } from "next";
import DocsView from "./components/docs-view";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Developer documentation for the VuMail transactional email API.",
};

export default function DocsPage() {
  return <DocsView />;
}
