"use client";

import { useQueryState, parseAsStringEnum } from "nuqs";
import CampaignsTab from "./campaigns-tab";
import ListsTab from "./lists-tab";
import TemplatesTab from "./templates-tab";

const TABS = ["campaigns", "lists", "templates"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  campaigns: "Campaigns",
  lists: "Contact Lists",
  templates: "Templates",
};

export default function MarketingView() {
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringEnum([...TABS]).withDefault("campaigns")
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Marketing Email</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create campaigns, manage contact lists, and design email templates.
        </p>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 dark:border-gray-700 px-5">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-5">
          {activeTab === "campaigns" && <CampaignsTab />}
          {activeTab === "lists" && <ListsTab />}
          {activeTab === "templates" && <TemplatesTab />}
        </div>
      </div>
    </div>
  );
}
