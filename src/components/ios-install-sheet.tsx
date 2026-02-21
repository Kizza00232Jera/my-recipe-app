"use client";

import { Share } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function IosInstallSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-10">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle>Add to Home Screen</SheetTitle>
        </SheetHeader>

        <ol className="space-y-5 px-1">
          <li className="flex items-start gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
              1
            </span>
            <p className="pt-0.5 text-sm text-zinc-700">
              Make sure you&apos;re using <span className="font-semibold">Safari</span> — the
              install option only works in Safari on iOS.
            </p>
          </li>

          <li className="flex items-start gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
              2
            </span>
            <p className="pt-0.5 text-sm text-zinc-700">
              Tap the{" "}
              <span className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-700">
                <Share size={12} />
                Share
              </span>{" "}
              button at the bottom of the screen.
            </p>
          </li>

          <li className="flex items-start gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
              3
            </span>
            <p className="pt-0.5 text-sm text-zinc-700">
              Scroll down in the menu and tap{" "}
              <span className="font-semibold">"Add to Home Screen"</span>, then tap{" "}
              <span className="font-semibold">Add</span>.
            </p>
          </li>
        </ol>
      </SheetContent>
    </Sheet>
  );
}
