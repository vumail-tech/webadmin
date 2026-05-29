import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "VuMail Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            VuMail
          </Link>
          <Link
            href="/signup"
            className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
          >
            ← Back to sign up
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">
          Last updated: June 2025
        </p>

        <div className="space-y-8 text-gray-700 dark:text-gray-300 text-sm leading-7">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              1. Introduction
            </h2>
            <p>
              VuMail (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, store, and safeguard your personal
              information when you use the VuMail platform. It applies to all administrators and
              users of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              2. Information We Collect
            </h2>
            <p className="mb-3">We collect the following categories of information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-gray-800 dark:text-white/90">Account information:</strong>{" "}
                Your name, email address, and password when you register.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-white/90">Domain and mailbox data:</strong>{" "}
                Domain names, mailbox configurations, DNS records, and settings you manage within the platform.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-white/90">Usage data:</strong>{" "}
                Log data including IP addresses, browser type, pages visited, and actions taken within the platform.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-white/90">Email metadata:</strong>{" "}
                For migration and delivery features, we process email metadata (sender, recipient, subject, timestamps). We do not read the content of your emails.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              3. How We Use Your Information
            </h2>
            <p className="mb-3">We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide, operate, and improve the VuMail platform.</li>
              <li>Authenticate users and manage account access.</li>
              <li>Process domain registrations and mailbox management requests.</li>
              <li>Send transactional emails such as password reset and account notifications.</li>
              <li>Monitor for abuse, spam, or violations of our Terms and Conditions.</li>
              <li>Comply with applicable legal and regulatory obligations in Kenya.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              4. Data Storage and Security
            </h2>
            <p>
              Your data is stored on servers located in Kenya or as disclosed during onboarding.
              We implement industry-standard security measures including encryption at rest and in
              transit, role-based access control, and regular security audits. While we take
              reasonable precautions, no system is completely secure and we cannot guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              5. Data Sharing
            </h2>
            <p className="mb-3">
              We do not sell or rent your personal information to third parties. We may share data
              with:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-gray-800 dark:text-white/90">Service providers</strong>{" "}
                (e.g., infrastructure and DNS providers) strictly to operate the platform.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-white/90">Law enforcement</strong>{" "}
                when required by Kenyan law or a valid court order.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-white/90">Successors</strong>{" "}
                in the event of a merger, acquisition, or sale of assets, with notice to you.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              6. Cookies and Tracking
            </h2>
            <p>
              We use essential session cookies to keep you authenticated while using the platform.
              We do not use advertising or third-party tracking cookies. You can configure your
              browser to refuse cookies, but this may prevent you from using certain features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              7. Data Retention
            </h2>
            <p>
              We retain your account data for as long as your account is active. If you close your
              account, we will delete or anonymise your personal data within 30 days, except where
              retention is required by law or for legitimate business purposes (e.g., billing
              records, abuse prevention).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              8. Your Rights
            </h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate or incomplete data.</li>
              <li>Request deletion of your data (subject to legal obligations).</li>
              <li>Object to or restrict certain processing of your data.</li>
              <li>Receive a copy of your data in a portable format.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:privacy@vuteer.com"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400 underline underline-offset-2"
              >
                privacy@vuteer.com
              </a>
              . We will respond within 14 business days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              9. Children&apos;s Privacy
            </h2>
            <p>
              VuMail is not intended for use by individuals under the age of 18. We do not
              knowingly collect personal information from minors. If you believe a minor has
              provided us with personal information, please contact us and we will remove it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant
              changes via the platform or email. Continued use of the platform after changes are
              posted constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              11. Contact Us
            </h2>
            <p>
              If you have questions or concerns about this Privacy Policy, please contact our
              Data Protection team at{" "}
              <a
                href="mailto:privacy@vuteer.com"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400 underline underline-offset-2"
              >
                privacy@vuteer.com
              </a>
              , or write to us at Altarion Systems, Nairobi, Kenya.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span>© {new Date().getFullYear()} Vuteer Enterprises. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-brand-500 dark:hover:text-brand-400">Terms</Link>
            <Link href="/privacy" className="hover:text-brand-500 dark:hover:text-brand-400">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
