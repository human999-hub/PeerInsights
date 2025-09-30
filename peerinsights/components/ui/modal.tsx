"use client";
import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function Modal({ open, onClose, title, children, footer }: Props) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
     <div className="fixed inset-0 z-60 grid place-items-baseline p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* panel */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
      >
        {/* flex column so header/body/footer stack; body scrolls */}
        <div className="flex max-h-[80vh] flex-col">
          <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button aria-label="Close" onClick={onClose} className="p-2 rounded hover:bg-black/5">✕</button>
          </div>

          <div className="px-6 py-4 overflow-y-auto">{children}</div>

          {footer && (
            <div className="px-6 py-4 border-t border-black/10 bg-white/60 backdrop-blur">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
