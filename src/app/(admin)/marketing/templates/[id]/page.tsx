import { Metadata } from "next";
import TemplateEditor from "./template-editor";

export const metadata: Metadata = {
  title: "Template Editor",
  description: "Design your email template with the VuMail block editor.",
};

export default function TemplateEditorPage() {
  return <TemplateEditor />;
}
