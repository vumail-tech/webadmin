// "use client";

// import { useState } from "react";

// interface DomainSettingsProps {
//   createdAt: string;
//   updatedAt: string;
//   spfStatus: string;
//   dkimStatus: string;
//   dmarcStatus: string;
//   status: string;
//   onToggleStatus: () => void;
// }

// export function DomainSettings({
//   createdAt,
//   updatedAt,
//   spfStatus,
//   dkimStatus,
//   dmarcStatus,
//   status,
//   onToggleStatus,
// }: DomainSettingsProps) {
//   const [active, setActive] = useState(status === "Active");

//   function toggleStatus() {
//     setActive(!active);
//     onToggleStatus();
//   }

//   return (
//     <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
//       <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Domain Settings</h3>

//       <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
//         <div>
//           <p className="text-gray-500 dark:text-gray-400 text-sm">Created At</p>
//           <p className="text-gray-800 dark:text-white">{createdAt}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 dark:text-gray-400 text-sm">Updated At</p>
//           <p className="text-gray-800 dark:text-white">{updatedAt}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 dark:text-gray-400 text-sm">Status</p>
//           <button
//             onClick={toggleStatus}
//             className={`px-3 py-1 rounded-full text-sm font-medium ${
//               active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
//             }`}
//           >
//             {active ? "Active" : "Inactive"}
//           </button>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
//         <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
//           <p className="text-gray-500 dark:text-gray-400 text-sm">SPF</p>
//           <p className="text-gray-800 dark:text-white">{spfStatus}</p>
//         </div>
//         <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
//           <p className="text-gray-500 dark:text-gray-400 text-sm">DKIM</p>
//           <p className="text-gray-800 dark:text-white">{dkimStatus}</p>
//         </div>
//         <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
//           <p className="text-gray-500 dark:text-gray-400 text-sm">DMARC</p>
//           <p className="text-gray-800 dark:text-white">{dmarcStatus}</p>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";
import { useState } from "react";
import  Switch  from "@/components/form/switch/Switch";
import Input from "@/components/form/input/InputField";
import  Button  from "@/components/ui/button/Button";

export  function DomainSettings() {
  // General Info
  const [domainName, setDomainName] = useState("example.com");
  const [statusActive, setStatusActive] = useState(true);

  // Aliases & Users
  const [maxAliases, setMaxAliases] = useState(10);
  const [aliases, setAliases] = useState<string[]>(["info", "support"]);
  const [maxStoragePerUser, setMaxStoragePerUser] = useState(500); // MB
  const [totalDomainStorage, setTotalDomainStorage] = useState(5000); // MB

  // Sending / Receiving Rules
  const [allowTransactional, setAllowTransactional] = useState(true);
  const [allowMarketing, setAllowMarketing] = useState(true);
  const [limitPerHour, setLimitPerHour] = useState(200);
  const [limitPerDay, setLimitPerDay] = useState(5000);
  const [limitPerWeek, setLimitPerWeek] = useState(20000);
  const [spamFilterEnabled, setSpamFilterEnabled] = useState(true);

  // Advanced Options
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [forwardingEnabled, setForwardingEnabled] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);

  const addAlias = () => {
    const aliasName = prompt("Enter alias name:");
    if (aliasName) setAliases([...aliases, aliasName]);
  };

  const removeAlias = (index: number) => {
    setAliases(aliases.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Domain Settings</h2>

      {/* General Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">General</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400">Domain Name</label>
            <Input value={domainName} onChange={(e) => setDomainName(e.target.value)} />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Active</label>
            <Switch checked={statusActive} onCheckedChange={setStatusActive} />
          </div>
        </div>
      </section>

      {/* Aliases & Users Management */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Aliases & Users</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400">Max Aliases</label>
            <Input type="number" value={maxAliases} onChange={(e) => setMaxAliases(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400">Max Storage per User (MB)</label>
            <Input type="number" value={maxStoragePerUser} onChange={(e) => setMaxStoragePerUser(Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400">Aliases</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {aliases.map((alias, index) => (
              <div key={index} className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                <span>{alias}@{domainName}</span>
                <button
                  onClick={() => removeAlias(index)}
                  className="text-red-500 dark:text-red-400 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
            <Button size="sm" onClick={addAlias}>Add Alias</Button>
          </div>
        </div>
      </section>

      {/* DNS / MX / SPF / DKIM / DMARC Records */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">DNS & Records</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {["MX", "SPF", "DKIM", "DMARC"].map((record) => (
            <div key={record}>
              <label className="block text-sm text-gray-600 dark:text-gray-400">{record} Record</label>
              <Input placeholder={`Enter ${record} record`} />
            </div>
          ))}
        </div>
      </div>

      {/* Storage Limits */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Storage Limits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400">Total Domain Storage (MB)</label>
            <Input type="number" value={totalDomainStorage} onChange={(e) => setTotalDomainStorage(Number(e.target.value))} />
          </div>
        </div>
      </section>

      {/* Sending / Receiving Rules */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Sending / Receiving Rules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch checked={allowTransactional} onCheckedChange={setAllowTransactional} />
            <span className="text-sm text-gray-600 dark:text-gray-400">Allow Transactional Emails</span>
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={allowMarketing} onCheckedChange={setAllowMarketing} />
            <span className="text-sm text-gray-600 dark:text-gray-400">Allow Marketing Emails</span>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400">Limit per Hour</label>
            <Input type="number" value={limitPerHour} onChange={(e) => setLimitPerHour(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400">Limit per Day</label>
            <Input type="number" value={limitPerDay} onChange={(e) => setLimitPerDay(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400">Limit per Week</label>
            <Input type="number" value={limitPerWeek} onChange={(e) => setLimitPerWeek(Number(e.target.value))} />
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={spamFilterEnabled} onCheckedChange={setSpamFilterEnabled} />
            <span className="text-sm text-gray-600 dark:text-gray-400">Enable Spam Filtering</span>
          </div>
        </div>
      </section>

      {/* Advanced Options */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Advanced Options</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
            <span className="text-sm text-gray-600 dark:text-gray-400">Auto-reply Enabled</span>
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={forwardingEnabled} onCheckedChange={setForwardingEnabled} />
            <span className="text-sm text-gray-600 dark:text-gray-400">Forwarding Enabled</span>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400">Retention Days</label>
            <Input type="number" value={retentionDays} onChange={(e) => setRetentionDays(Number(e.target.value))} />
          </div>
        </div>
      </section>

      <Button className="mt-4">Save Settings</Button>
    </div>
  );
}
