import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "VuMail Terms and Conditions — read the terms governing use of our email management platform.",
};

export default function TermsPage() {
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
          Terms and Conditions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">
          Last updated: June 2025
        </p>

        <div className="space-y-8 text-gray-700 dark:text-gray-300 text-sm leading-7">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By creating an account and accessing the VuMail platform, you agree to be bound by
              these Terms and Conditions. If you do not agree to these terms, you may not use the
              platform. These terms apply to all administrators, users, and organisations that
              access VuMail services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              2. Description of Service
            </h2>
            <p>
              VuMail is a self-hosted business email management platform that enables organisations
              to manage email domains, mailboxes, DNS records, aliases, and associated mail
              infrastructure. The platform is operated by Vuteer Enterprises and developed by
              Altarion Systems, based in Kenya.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              3. Account Responsibilities
            </h2>
            <p className="mb-3">
              You are responsible for maintaining the confidentiality of your account credentials.
              As an administrator, you are responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All activity that occurs under your account.</li>
              <li>Ensuring your organisation&apos;s users comply with these terms.</li>
              <li>Keeping your admin credentials secure and not sharing them.</li>
              <li>Promptly notifying us of any unauthorised use of your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              4. Acceptable Use
            </h2>
            <p className="mb-3">You agree not to use VuMail to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Send unsolicited bulk email (spam) or conduct phishing campaigns.</li>
              <li>Distribute malware, viruses, or harmful content via email.</li>
              <li>Violate any applicable Kenyan or international laws and regulations.</li>
              <li>Impersonate individuals or organisations.</li>
              <li>Attempt to gain unauthorised access to the platform or its infrastructure.</li>
              <li>Use the service in any manner that could damage, disable, or impair it.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              5. Domain and Mailbox Management
            </h2>
            <p>
              You represent that you own or have the legal right to manage any domain you add to
              the platform. VuMail reserves the right to suspend domains found to be in violation
              of these terms or applicable law without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              6. Data and Privacy
            </h2>
            <p>
              Your use of the platform is also governed by our{" "}
              <Link href="/privacy" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 underline underline-offset-2">
                Privacy Policy
              </Link>
              , which is incorporated into these terms by reference.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              7. Intellectual Property
            </h2>
            <p>
              All software, design, and content that makes up the VuMail platform is the property
              of Vuteer Enterprises and Altarion Systems. You are granted a limited, non-exclusive,
              non-transferable licence to use the platform solely for its intended purpose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              8. Service Availability
            </h2>
            <p>
              We strive to maintain high availability but do not guarantee uninterrupted access.
              Scheduled maintenance, upgrades, or events beyond our control may result in temporary
              downtime. We will provide reasonable notice of planned maintenance where possible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              9. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, VuMail, Vuteer Enterprises, and Altarion
              Systems shall not be liable for any indirect, incidental, special, or consequential
              damages arising from your use of, or inability to use, the platform — including loss
              of data, loss of revenue, or business interruption.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              10. Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your account at any time if you breach
              these terms. You may also terminate your account at any time by contacting support.
              Upon termination, your access to the platform will cease immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              11. Governing Law
            </h2>
            <p>
              These terms are governed by the laws of Kenya. Any disputes arising from the use of
              this platform shall be subject to the exclusive jurisdiction of the courts of Kenya.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              12. Changes to These Terms
            </h2>
            <p>
              We may update these Terms and Conditions from time to time. Continued use of the
              platform after changes are posted constitutes your acceptance of the revised terms.
              We will notify active users of material changes via the platform or email.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              13. Contact
            </h2>
            <p>
              If you have questions about these terms, please contact us at{" "}
              <a
                href="mailto:support@vuteer.com"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400 underline underline-offset-2"
              >
                support@vuteer.com
              </a>.
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
