import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new VuMail admin account to start managing your email infrastructure.",
};

export default function SignUp() {
  return <SignUpForm />;
}
