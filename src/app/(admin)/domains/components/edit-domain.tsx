"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { adminUpdateDomain } from "@/api/admin";

interface Domain {
  _id: string;
  domain: string;
  status: string;
  mailcow?: { active: boolean };
}

export default function EditDomainModal({
  isOpen,
  domain,
  onClose,
}: {
  isOpen: boolean;
  domain: Domain;
  onClose: () => void;
}) {
  const [description, setDescription] = useState("");
  const [maxquota, setMaxquota] = useState("");
  const [active, setActive] = useState(domain.mailcow?.active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, any> = { active };
      if (description.trim()) payload.description = description.trim();
      if (maxquota) payload.maxquota = parseInt(maxquota);

      const rs = await adminUpdateDomain(domain.domain, payload);
      if (rs?.success) {
        onClose();
      } else {
        setError(rs?.message || "Failed to update domain");
      }
    } catch {
      setError("Failed to update domain");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-800 dark:text-white text-lg">
          Edit <span className="text-blue-600">{domain.domain}</span>
        </h2>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <Input placeholder="e.g. Company main domain" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Max Quota (MB)</label>
          <Input type="number" placeholder="10240" value={maxquota} onChange={(e) => setMaxquota(e.target.value)} />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="active-toggle"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <label htmlFor="active-toggle" className="text-sm text-gray-700 dark:text-gray-300">
            Domain active
          </label>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
            Cancel
          </button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
