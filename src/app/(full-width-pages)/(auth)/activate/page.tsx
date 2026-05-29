import { Suspense } from "react";
import ActivateEmailForm from "@/components/auth/ActivateEmailForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activate Account",
  description: "Activate your VuMail admin account.",
};

export default function ActivatePage() {
  return (
    <Suspense>
      <ActivateEmailForm />
    </Suspense>
  );
}
