"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import {Modal} from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { addDomain } from "@/api/domain";
import { adminGetPlans } from "@/api/admin";

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Plan {
  _id: string;
  key: string;
  name: string;
  currency: string;
  price: number;
  includedMailboxes: number;
}

export default function AddDomainModal({
  isOpen,
  onClose,
}: AddDomainModalProps) {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planKey, setPlanKey] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load plans when the modal opens; pre-select the lowest (first) tier.
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const res = await adminGetPlans();
      if (res?.success && res.data?.length) {
        setPlans(res.data);
        setPlanKey((prev) => prev || res.data[0].key);
      }
    })();
  }, [isOpen]);

  const isValidDomain = (value: string) =>
    /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value.trim());

  const handleSubmit = async () => {
    const cleanDomain = domain.trim().toLowerCase();

    if (!cleanDomain) {
      setError("Domain name is required");
      return;
    }

    if (!isValidDomain(cleanDomain)) {
      setError("Enter a valid domain e.g. example.com");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const rs = await addDomain(cleanDomain, planKey || undefined);
      if (!rs.success) {
        setError(rs.message);
      } else {
        onClose();
        router.push(`/domains/${cleanDomain}`);
      }

    } catch (err) {
      setError("Failed to add domain. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="space-y-4 w-full">
        <h2 className="font-semibold text-gray-800 text-title-xs dark:text-white/90 text-sm lg:text-lg">Add Domain</h2>
        <div className="space-y-2">
          <label className="text-gray-800 text-title-xs dark:text-white/90 block text-sm font-medium ">
            Domain name
          </label>
          <Input
            type="text"
            placeholder="example.com"
            defaultValue={domain}

            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Plan selection */}
        <div className="space-y-2">
          <label className="text-gray-800 text-title-xs dark:text-white/90 block text-sm font-medium">
            Plan
          </label>
          {plans.length === 0 ? (
            <p className="text-xs text-gray-400">Loading plans…</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              {plans.map((p) => {
                const selected = p.key === planKey;
                return (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => setPlanKey(p.key)}
                    className={`relative rounded-xl border p-3 text-left transition-colors ${
                      selected
                        ? "border-blue-600 ring-1 ring-blue-600"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    {selected && (
                      <Check size={14} className="absolute right-2 top-2 text-blue-600" />
                    )}
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{p.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {p.currency} {(p.price ?? 0).toLocaleString()}/yr
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{p.includedMailboxes} mailboxes</p>
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-xs text-gray-400">Starts with a 14-day free trial. You can change plans anytime.</p>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <div className="w-full grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-muted"
          >
            Cancel
          </button>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg  hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Adding…" : "Add domain"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
