"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export interface NavItem {
  href: string;
  label: string;
}

/** Disclosure-style mobile menu: button with aria-expanded, closes on Escape / route click. */
export function MobileNav({ items, menuLabel, closeLabel }: { items: NavItem[]; menuLabel: string; closeLabel: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="ui rounded border border-white/30 px-3 py-2 text-sm"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? closeLabel : menuLabel}
      </button>
      {open && (
        <nav id={id} aria-label={menuLabel} className="ui absolute inset-x-0 top-full border-t border-white/15 bg-deep px-4 pb-4">
          <ul className="grid gap-1 pt-2">
            {items.map((i) => (
              <li key={i.href}>
                <Link href={i.href} onClick={() => setOpen(false)} className="block rounded px-2 py-3 text-base hover:bg-white/10">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
