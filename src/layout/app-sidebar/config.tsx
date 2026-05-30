import { BookOpen, CreditCard, Globe, LayoutGrid, ListChecks, Mail, MessageSquare, Send } from "lucide-react";

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
  }[];
};

export const MAIN_NAV: NavItem[] = [
  {
    name: "Dashboard",
    icon: <LayoutGrid />,
    path: "/",
  },
  {
    name: "Domains",
    icon: <Globe />,
    path: "/domains",
  },
  {
    name: "Billing",
    icon: <CreditCard />,
    path: "/billing",
  },

];

export const SUB_NAV: NavItem[] = [
  {
    name: "Transactional Email",
    icon: <Mail />,
    path: "/transactional",
  },
  {
    name: "Marketing Email",
    icon: <Send />,
    path: "/marketing",
  },
  {
    name: "Waitlists",
    icon: <ListChecks />,
    path: "/waitlists",
  },
  {
    name: "Bulk SMS",
    icon: <MessageSquare />,
    path: "#",
  },
];

// Pinned to the bottom of the sidebar
export const BOTTOM_NAV: NavItem[] = [
  {
    name: "Documentation",
    icon: <BookOpen />,
    path: "/docs",
  },
];
