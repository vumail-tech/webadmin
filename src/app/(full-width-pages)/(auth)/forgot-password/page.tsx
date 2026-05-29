import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your VuMail admin account password.",
};

export default function ForgotPassword() {
  return <ForgotPasswordForm />;
}
