"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { generatePassword } from "@/lib/generate-password";
import { addMailbox } from "@/api/mailbox";
import { Check, Copy } from "lucide-react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddUserModal({
  isOpen,
  onClose,
}: AddUserModalProps) {
  const router = useRouter();
  const params = useParams();
  const domain = params?.domain as string;

  const [localPart, setLocalPart] = useState("");
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [stage, setStage] = useState(0)

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState<"email" | "password" | null>(null);


  const isValidLocalPart = (value: string) =>
    /^[a-z0-9._-]+$/i.test(value.trim());

  const handleSubmit = async () => {
    const cleanLocalPart = localPart.trim().toLowerCase();

    if (!cleanLocalPart) {
      setError("Email username is required");
      return;
    }

    if (!isValidLocalPart(cleanLocalPart)) {
      setError("Only letters, numbers, dots and dashes allowed");
      return;
    }

    if (!name.trim()) {
      setError("Full name is required");
      return;
    }

    const password = generatePassword(8);
    setGeneratedPassword(password);

    const payload = {
      localPart: cleanLocalPart,
      name: name.trim(),
      password,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };


    try {
      setLoading(true);
      setError(null);

      const rs = await addMailbox(domain, payload);

      if (!rs.success) {
        setError(rs.message);
      } else {
        // onClose();
        setStage(1)
        router.refresh();
        console.log("ADD TOAST: User created", password);
      }
    } catch (err) {
      setError("Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (
    value: string,
    type: "email" | "password"
  ) => {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      {
        stage === 0  ? (
          <div className="space-y-4 w-full">
            <h2 className="font-semibold text-gray-800 dark:text-white/90 text-sm lg:text-lg">
              Add Mailbox
            </h2>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-800 dark:text-white/90">
                Email address
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="info"
                  onChange={(e) => setLocalPart(e.target.value)}
                />
                <span className="text-sm text-gray-500">@{domain}</span>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-800 dark:text-white/90">
                Full name
              </label>
              <Input
                type="text"
                placeholder="John Doe"
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-800 dark:text-white/90">
                Tags (optional)
              </label>
              <Input
                type="text"
                placeholder="sales, support"
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="grid grid-cols-2 gap-2 pt-2">
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
                className="px-4 py-2 text-sm rounded-lg hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Creating…" : "Add user"}
              </Button>
            </div>
          </div>
        ): null
      }
      {stage === 1 ? (
        <div className="space-y-6 w-full text-center">
          {/* Success animation (simple + clean) */}
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl">
              ✓
            </div>
          </div>

          <h2 className="font-semibold text-gray-800 dark:text-white/90 text-lg">
            Mailbox created
          </h2>

          <p className="text-sm text-gray-500">
            Copy the credentials below and share them securely with the user.
          </p>

          {/* Email */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Email address
            </label>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted">
              <div className="flex-1  text-sm ">
                {localPart}@{domain}
              </div>
              <button
                onClick={() =>
                  copyToClipboard(`${localPart}@${domain}`, "email")
                }
                disabled={copied === "email"}
                className="p-2 rounded-lg hover:bg-muted"
                title="Copy email"
              >
                {copied === "email" ? <Check className=" text-green-600" />: <Copy />}
              </button>
            </div>

          </div>

          {/* Password */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Password
            </label>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-muted">
              <div className="flex-1  text-sm font-mono ">
                {generatedPassword}
              </div>
              <button
                onClick={() =>
                  copyToClipboard(generatedPassword, "password")
                }
                disabled={copied === "password"}
                className="p-2 rounded-lg hover:bg-muted"
                title="Copy password"
              >
                {copied === "password" ? <Check className=" text-green-600" /> : <Copy />}
              </button>
            </div>

          </div>

          {/* Close */}
          <Button
            onClick={() => {
              setStage(0);
              setLocalPart("");
              setName("");
              setTags("");
              setGeneratedPassword("");
              setCopied(null);
              onClose();
            }}
            className="w-full"
          >
            Done
          </Button>
        </div>
      ) : null}

    </Modal>
  );
}
