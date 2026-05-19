"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { useQueryState, parseAsStringEnum } from "nuqs";

import { UsersTable } from "./components/users";
import AliasesTab from "./components/aliases";
import Badge from "@/components/ui/badge/Badge";
import { DomainOverview } from "./components/overview";
import SendingRules from "./components/sending-rules";
import StorageTab from "./components/storage";
import RecordsTab from "./components/records";
import SecurityTab from "./components/security";
import AdvancedTab from "./components/advanced";
import MigrationTab from "./components/migration";
import { DomainStatusType } from "@/types/domain";
import { adminGetDomain, adminDeleteDomain } from "@/api/admin";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import EditDomainModal from "../components/edit-domain";

const TABS = [
  "overview", "users", "aliases", "records",
  "sending-rules", "storage", "security", "migration", "advanced",
] as const;

type Tab = typeof TABS[number];

export default function DomainDetailView() {
  const { domain: domainName } = useParams() as { domain: string };
  const router = useRouter();

  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringEnum([...TABS]).withDefault("overview")
  );

  const [domain, setDomain] = useState<any>(null);
  const [status, setStatus] = useState<DomainStatusType>("PENDING_DNS");
  const [records, setRecords] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDomain = async () => {
    setLoading(true);
    try {
      const response = await adminGetDomain(domainName);
      if (response?.success) {
        const d = response.data;
        setStatus(d.status);
        setDomain({ ...d, metrics: null, records: null });
        setRecords(d.records);
        setMetrics(d.metrics);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (domainName) fetchDomain();
  }, [domainName]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Link href="/domains" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {domainName}
              {loading && <RefreshCw size={16} className="inline ml-2 animate-spin text-gray-400" />}
            </h1>
          </div>
          <Badge color={status === "ACTIVE" ? "success" : status === "PENDING_DNS" ? "warning" : "error"}>
            {status.replace("_", " ")}
          </Badge>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <nav className="-mb-px flex space-x-6 min-w-max" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              data-tab={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.replace("-", " ")}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && <DomainOverview metrics={metrics} />}
        {activeTab === "users" && <UsersTable domainStatus={status} />}
        {activeTab === "aliases" && <AliasesTab />}
        {activeTab === "records" && (
          <RecordsTab
            records={records}
            domainStatus={status}
            onVerified={() => fetchDomain()}
          />
        )}
        {activeTab === "sending-rules" && <SendingRules />}
        {activeTab === "storage" && <StorageTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "advanced" && <AdvancedTab />}
        {activeTab === "migration" && <MigrationTab />}
      </div>

      {/* Edit Modal */}
      {showEdit && domain && (
        <EditDomainModal
          isOpen={showEdit}
          domain={domain}
          onClose={() => { setShowEdit(false); fetchDomain(); }}
        />
      )}

      {/* Delete Confirmation */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Delete Domain</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Permanently delete <strong className="text-red-600">{domainName}</strong> and all its mailboxes, aliases, and emails? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDelete(false)} className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button
              onClick={async () => {
                setDeleting(true);
                try {
                  await adminDeleteDomain(domainName);
                  router.replace("/domains");
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete Domain"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
