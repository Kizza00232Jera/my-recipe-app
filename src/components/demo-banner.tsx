import Link from "next/link";
import { ChefHat } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="sticky top-0 z-40 bg-zinc-900 px-4 py-2.5 text-center text-sm text-white">
      <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <ChefHat size={14} />
          You&apos;re viewing a demo
        </span>
        <span className="hidden text-zinc-500 sm:inline">·</span>
        <span className="text-zinc-300">Sign in to create your own recipe collection</span>
        <Link
          href="/sign-in"
          className="ml-1 rounded-full bg-white px-3 py-0.5 text-xs font-semibold text-zinc-900 transition-opacity hover:opacity-80"
        >
          Sign in →
        </Link>
      </span>
    </div>
  );
}
