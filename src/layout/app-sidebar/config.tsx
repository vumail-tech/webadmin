import { Globe, LayoutGrid, Mail, MessageSquare, Send } from "lucide-react";

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

];

export const SUB_NAV: NavItem[] = [

  {
    name: "Transactional Email",
    icon: <Mail />,
    path: "#",
  },

  {
    name: "Marketing Email",
    icon: <Send />,
    path: "#",
  },

  {
    name: "Bulk SMS",
    icon: <MessageSquare />,
    path: "#",
  },
];
