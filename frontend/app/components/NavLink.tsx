"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavLink({
  href,
  children,
  className = "",
  testid,
}: {
  href: string;
  children: string;
  className?: string;
  testid?: string;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      data-testid={testid}
      aria-current={active ? "page" : undefined}
      className={`text-sm transition-colors ${
        active
          ? "font-medium text-brand-700"
          : "text-slate-600 hover:text-brand-700"
      } ${className}`}
    >
      {children}
    </Link>
  );
}
