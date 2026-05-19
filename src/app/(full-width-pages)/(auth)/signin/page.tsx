import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your VuMail admin account to manage domains, mailboxes, and mail settings.",
};

export default function SignIn() {
  return <SignInForm />;
}
