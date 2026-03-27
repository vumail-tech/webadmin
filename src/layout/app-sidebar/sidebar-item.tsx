"use client";
import Link from "next/link";
import { ChevronDownIcon } from "../../icons";
import { NavItem } from "./config";

type Props = {
  nav: NavItem;
  isActive: (path: string) => boolean;
  isExpanded: boolean;
  isHovered: boolean;
  isMobileOpen: boolean;
  onToggle?: () => void;
  isOpen?: boolean;
};

export const SidebarMenuItem = ({
  nav,
  isActive,
  isExpanded,
  isHovered,
  isMobileOpen,
  onToggle,
  isOpen,
}: Props) => {
  const showText = isExpanded || isHovered || isMobileOpen;

  if (nav.subItems) {
    return (
      <button
        onClick={onToggle}
        className={`menu-item group ${
          isOpen ? "menu-item-active" : "menu-item-inactive"
        }`}
      >
        <span>{nav.icon}</span>
        {showText && <span className="menu-item-text">{nav.name}</span>}
        {showText && (
          <ChevronDownIcon
            className={`ml-auto transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>
    );
  }

  if (!nav.path) return null;

  return (
    <Link
      href={nav.path}
      className={`menu-item group ${
        isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
      }`}
    >
      <span>{nav.icon}</span>
      {showText && <span className="menu-item-text">{nav.name}</span>}
    </Link>
  );
};
