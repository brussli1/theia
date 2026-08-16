"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { CategoryTreeNode } from "../lib/categories";

function MenuLink({
  href,
  children,
  className,
}: {
  href: string;
  children: string;
  className: string;
}) {
  return (
    <Link href={href} className={`${className} transition-colors hover:text-brand-700`}>
      {children}
    </Link>
  );
}

/** Dropdown mega-menu for the category tree. Opens on hover (desktop),
 *  tap (mobile, via the trigger button) and keyboard focus. */
export default function CategoryMenu({ tree }: { tree: CategoryTreeNode[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = (slug: string) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }
    setOpenSlug(slug);
  };
  const scheduleClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }
    closeTimer.current = setTimeout(() => setOpenSlug(null), 120);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
      {tree.map((root) => {
        if (root.children.length === 0) {
          return (
            <MenuLink
              key={root.slug}
              href={`/categorias/${root.slug}`}
              className="text-sm text-slate-600"
            >
              {root.name}
            </MenuLink>
          );
        }
        const isOpen = openSlug === root.slug;
        return (
          <div
            key={root.slug}
            className="relative"
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") {
                open(root.slug);
              }
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") {
                scheduleClose();
              }
            }}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-haspopup="true"
              data-testid={`menu-trigger-${root.slug}`}
              onClick={() => open(root.slug)}
              onFocus={() => open(root.slug)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                isOpen ? "font-medium text-brand-700" : "text-slate-600 hover:text-brand-700"
              }`}
            >
              {root.name}
              <span aria-hidden="true" className="text-xs">▾</span>
            </button>
            {isOpen && (
              <div
                data-testid={`menu-panel-${root.slug}`}
                className="absolute left-0 top-full z-50 mt-1 rounded-xl border border-slate-200 bg-white p-5 shadow-lg"
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") {
                    open(root.slug);
                  }
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType === "mouse") {
                    scheduleClose();
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setOpenSlug(null);
                  }
                }}
              >
                <div className="grid max-h-[70vh] w-max max-w-[min(90vw,48rem)] grid-cols-2 gap-x-8 gap-y-5 overflow-y-auto md:grid-cols-3">
                  {root.children.map((child) => (
                    <div key={child.slug}>
                      {child.children.length > 0 ? (
                        <>
                          <MenuLink
                            href={`/categorias/${child.slug}`}
                            className="block text-sm font-semibold text-slate-900"
                          >
                            {child.name}
                          </MenuLink>
                          <ul className="mt-1.5 space-y-1">
                            {child.children.map((leafNode) => (
                              <li key={leafNode.slug}>
                                <MenuLink
                                  href={`/categorias/${leafNode.slug}`}
                                  className="text-sm text-slate-600"
                                >
                                  {leafNode.name}
                                </MenuLink>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <MenuLink
                          href={`/categorias/${child.slug}`}
                          className="block text-sm font-semibold text-slate-900"
                        >
                          {child.name}
                        </MenuLink>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
