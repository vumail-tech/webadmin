import { Outfit } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: "VuMail Admin",
    template: "%s | VuMail",
  },
  description: "Manage your email domains, mailboxes, DNS records, and mail infrastructure with VuMail.",
};

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
