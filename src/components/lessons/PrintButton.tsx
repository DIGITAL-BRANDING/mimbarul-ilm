"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="ui rounded border border-rule px-3 py-1.5 text-sm hover:bg-parchment">
      {label}
    </button>
  );
}
