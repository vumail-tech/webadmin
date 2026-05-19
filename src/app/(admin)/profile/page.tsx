
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your VuMail account details, preferences, and security settings.",
};

export default function Profile() {
  return (

      <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">

          <UserMetaCard />
          <UserInfoCard />

      </div>

  );
}
