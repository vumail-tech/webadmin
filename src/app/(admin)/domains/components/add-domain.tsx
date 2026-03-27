"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {Modal} from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { addDomain } from "@/api/domain";

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddDomainModal({
  isOpen,
  onClose,
}: AddDomainModalProps) {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // TODO: replace with real API call
      // await new Promise((res) => setTimeout(res, 800));
      const rs = await addDomain(cleanDomain);
      if (!rs.success) {
        setError(rs.message);
      } else {
        onClose();
        router.push(`/domains/${cleanDomain}`);
        console.log("ADD TOAST HERE")
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
