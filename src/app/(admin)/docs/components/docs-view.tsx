"use client";

import { useState } from "react";
import { Check, Copy, BookOpen, KeyRound, Send, AlertTriangle, Gauge, FileText, ListChecks } from "lucide-react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "https://your-api-host"}/api`;

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      {lang && (
        <span className="absolute left-3 top-2 text-[10px] uppercase tracking-wider text-gray-500">
          {lang}
        </span>
      )}
      <button
        onClick={copy}
        className="absolute right-2 top-2 p-1.5 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700"
        title="Copy"
      >
        {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
      </button>
      <pre className="mt-1 overflow-x-auto rounded-xl bg-gray-900 p-4 pt-7 text-xs leading-relaxed text-green-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const SECTIONS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "auth", label: "Get an API key", icon: KeyRound },
  { id: "send", label: "Send an email", icon: Send },
  { id: "errors", label: "Errors", icon: AlertTriangle },
  { id: "limits", label: "Rate limits", icon: Gauge },
  { id: "logs", label: "Logs & delivery", icon: FileText },
  { id: "waitlist", label: "Waitlist API", icon: ListChecks },
];

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-xl font-semibold text-gray-800 dark:text-white">
      {children}
    </h2>
  );
}

export default function DocsView() {
  const curl = `curl -X POST ${API_BASE}/transactional/send \\
  -H "Authorization: Bearer $VUMAIL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "no-reply@yourdomain.com",
    "to": "user@example.com",
    "subject": "Welcome to Acme",
    "html": "<h1>Welcome 🎉</h1><p>Thanks for signing up.</p>",
    "replyTo": "support@yourdomain.com"
  }'`;

  const node = `const res = await fetch("${API_BASE}/transactional/send", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.VUMAIL_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "no-reply@yourdomain.com",
    to: ["user@example.com", "ops@example.com"],
    subject: "Your receipt",
    html: "<p>Thanks for your purchase.</p>",
  }),
});

const data = await res.json();
if (!res.ok) throw new Error(data.error);
console.log("Sent:", data.messageId);`;

  const python = `import os, requests

resp = requests.post(
    "${API_BASE}/transactional/send",
    headers={"Authorization": f"Bearer {os.environ['VUMAIL_API_KEY']}"},
    json={
        "from": "no-reply@yourdomain.com",
        "to": "user@example.com",
        "subject": "Password reset",
        "html": "<p>Click the link to reset your password.</p>",
    },
)
resp.raise_for_status()
print(resp.json()["messageId"])`;

  const success = `{ "success": true, "messageId": "<abc123@yourdomain.com>" }`;

  const waitlistSubmit = `await fetch("${API_BASE}/waitlist/<publicKey>/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    name: "Ada Lovelace",   // optional + any custom fields you configured
    _hp: ""                 // honeypot — leave empty
  }),
});
// -> { "success": true, "status": "pending" }   (then the user confirms via email)`;

  return (
    <div className="flex gap-8">
      {/* Table of contents */}
      <aside className="hidden w-52 shrink-0 lg:block">
        <div className="sticky top-24 space-y-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            On this page
          </p>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <s.icon size={14} /> {s.label}
            </a>
          ))}
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-10">
        <header>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Documentation</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Send transactional email from your verified domains over a simple REST API.
          </p>
        </header>

        {/* Overview */}
        <section className="space-y-3">
          <H id="overview">Overview</H>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            The Transactional Email API lets your applications send receipts, password resets,
            alerts, and notifications from any domain you&apos;ve added and verified. Each domain has
            its own API key. Sending is gated by the domain&apos;s billing subscription and Mailcow
            status.
          </p>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-white/[0.03]">
            <span className="font-medium text-gray-700 dark:text-gray-200">Base URL</span>
            <code className="ml-2 rounded bg-gray-200 px-2 py-0.5 font-mono text-xs dark:bg-gray-800">
              {API_BASE}
            </code>
          </div>
        </section>

        {/* Auth */}
        <section className="space-y-3">
          <H id="auth">Get an API key</H>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>
              Open <span className="font-medium">Transactional Email</span> in the sidebar.
            </li>
            <li>
              Find your domain (it must be <strong>ACTIVE</strong> — DNS verified) and click{" "}
              <span className="font-medium">Generate Key</span>.
            </li>
            <li>
              Copy the key immediately — it is shown <strong>only once</strong> and looks like{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">
                vtk_…
              </code>
              .
            </li>
          </ol>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Send it as a Bearer token on every request:
          </p>
          <CodeBlock code={`Authorization: Bearer vtk_xxxxxxxx`} lang="http" />
        </section>

        {/* Send */}
        <section className="space-y-4">
          <H id="send">Send an email</H>
          <CodeBlock code={`POST ${API_BASE}/transactional/send`} lang="http" />

          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Field</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Required</th>
                  <th className="px-4 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600 dark:divide-gray-800 dark:text-gray-300">
                {[
                  ["from", "string", "yes", "Must use the key's domain. \"Name <no-reply@domain>\" is OK."],
                  ["to", "string | string[]", "yes", "One or more recipients."],
                  ["subject", "string", "yes", ""],
                  ["html", "string", "yes*", "HTML body. *html or text (or both) required."],
                  ["text", "string", "yes*", "Plain text. Auto-derived from html if omitted."],
                  ["cc", "string | string[]", "no", ""],
                  ["bcc", "string | string[]", "no", ""],
                  ["replyTo", "string", "no", ""],
                ].map(([f, t, r, n]) => (
                  <tr key={f}>
                    <td className="px-4 py-2 font-mono text-xs">{f}</td>
                    <td className="px-4 py-2 font-mono text-xs">{t}</td>
                    <td className="px-4 py-2">{r}</td>
                    <td className="px-4 py-2 text-xs">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Success — 200</p>
            <CodeBlock code={success} lang="json" />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Examples</p>
            <CodeBlock code={curl} lang="bash" />
            <CodeBlock code={node} lang="javascript" />
            <CodeBlock code={python} lang="python" />
          </div>
        </section>

        {/* Errors */}
        <section className="space-y-3">
          <H id="errors">Errors</H>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">error</th>
                  <th className="px-4 py-2 font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600 dark:divide-gray-800 dark:text-gray-300">
                {[
                  ["400", "validation message", "Missing from/to/subject, or neither html nor text."],
                  ["401", "Missing Authorization…", "No Authorization: Bearer header."],
                  ["401", "Invalid API key", "Key not found / revoked."],
                  ["402", "subscription_inactive", "Domain's billing subscription is suspended or canceled."],
                  ["403", "from-domain message", "from does not match the key's domain."],
                  ["403", "Domain is not active", "Domain isn't ACTIVE (DNS not verified or suspended)."],
                  ["429", "Too Many Requests", "Rate limit exceeded."],
                  ["502", "Failed to deliver email", "Upstream SMTP delivery failed (see detail)."],
                ].map(([s, e, m]) => (
                  <tr key={`${s}-${e}`}>
                    <td className="px-4 py-2 font-mono text-xs">{s}</td>
                    <td className="px-4 py-2 font-mono text-xs">{e}</td>
                    <td className="px-4 py-2 text-xs">{m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Rate limits */}
        <section className="space-y-3">
          <H id="limits">Rate limits</H>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            The send endpoint is limited to <strong>100 requests per minute per IP</strong>.
            Exceeding it returns <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">429 Too Many Requests</code>.
          </p>
        </section>

        {/* Logs & delivery */}
        <section className="space-y-3">
          <H id="logs">Logs &amp; delivery</H>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>Every send is recorded — view per-domain logs under <span className="font-medium">Transactional Email → Logs</span>.</li>
            <li>
              When the <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">from</code> address
              is a mailbox VuMail manages, the message is sent authenticated as that mailbox; otherwise it is
              relayed via the platform relay account.
            </li>
            <li>
              For best deliverability, verify the domain&apos;s SPF, DKIM, and DMARC records (the
              domain&apos;s <span className="font-medium">Records</span> tab).
            </li>
          </ul>
        </section>

        {/* Waitlist API */}
        <section className="space-y-4">
          <H id="waitlist">Waitlist API</H>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            Collect signups from your own site or app. Create a waitlist under{" "}
            <span className="font-medium">Waitlists</span>, then POST signups to its public submit
            endpoint. With double opt-in on (the default), each signup gets a confirmation email and
            only counts once confirmed.
          </p>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-white/[0.03]">
            <span className="font-medium text-gray-700 dark:text-gray-200">Endpoint</span>
            <code className="ml-2 break-all rounded bg-gray-200 px-2 py-0.5 font-mono text-xs dark:bg-gray-800">
              POST {API_BASE}/waitlist/&lt;publicKey&gt;/submit
            </code>
          </div>

          <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>
              The <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">publicKey</code>{" "}
              (<code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">wlk_…</code>) is{" "}
              <strong>publishable</strong> — safe to use in client-side code. It is <em>not</em> the secret{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">vtk_</code> transactional key.
            </li>
            <li>
              Body: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">email</code> (required),
              optional <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">name</code>, plus any
              custom fields you configured. Always include an empty{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">_hp</code> honeypot field.
            </li>
            <li>
              Abuse protection: honeypot + <strong>20 requests/min per IP</strong> + an optional per-waitlist
              allowed-origins list (set it to restrict which sites may submit).
            </li>
            <li>Confirmed signups become contacts you can email with a marketing campaign.</li>
          </ul>

          <CodeBlock code={waitlistSubmit} lang="javascript" />
        </section>
      </div>
    </div>
  );
}
