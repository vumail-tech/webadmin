"use client";

import { useState } from "react";
import {Select} from "./utils";
import Button from "@/components/ui/button/Button";
import { card_className } from "./config";

export function TeamTab() {
  const [role, setRole] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Domain Team
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage who can access and administer this domain
          </p>
        </div>

        <Button>Invite Member</Button>
      </div>

      {/* Team table */}
      <div className={card_className}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                User
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Role
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {/* Example row */}
            <tr>
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    jane@company.com
                  </p>
                  <p className="text-xs text-gray-500">Jane Doe</p>
                </div>
              </td>

              <td className="px-4 py-3">
                <Select
                  value={role}
                  onChange={setRole}
                  options={[
                    { label: "Owner", value: "owner" },
                    { label: "Admin", value: "admin" },
                    { label: "Viewer", value: "viewer" },
                  ]}
                />
              </td>

              <td className="px-4 py-3">
                <span className="rounded-full bg-success-50 px-2 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-400">
                  Active
                </span>
              </td>

              <td className="px-4 py-3 text-right">
                <button className="text-sm text-red-600 hover:underline">
                  Remove
                </button>
              </td>
            </tr>

            {/* Invited user */}
            <tr>
              <td className="px-4 py-3">
                <p className="font-medium text-gray-800 dark:text-white/90">
                  mark@agency.com
                </p>
              </td>

              <td className="px-4 py-3 text-gray-400">Admin</td>

              <td className="px-4 py-3">
                <span className="rounded-full bg-warning-50 px-2 py-1 text-xs font-medium text-warning-600 dark:bg-warning-500/15 dark:text-warning-400">
                  Invited
                </span>
              </td>

              <td className="px-4 py-3 text-right">
                <button className="text-sm text-gray-500 hover:underline">
                  Resend Invite
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
