"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Plus, Settings } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type BottomNavProps = {
  onAddRecipe: () => void;
};

export function BottomNav({ onAddRecipe }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white">
      <div className="flex items-center justify-around px-6 pb-safe">
        {/* Home */}
        <button
          onClick={() => router.push("/")}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium transition-colors",
            pathname === "/" ? "text-zinc-900" : "text-zinc-400"
          )}
        >
          <Home size={22} />
          <span>Home</span>
        </button>

        {/* Add Recipe — prominent center button */}
        <div className="flex flex-col items-center -mt-5">
          <button
            onClick={onAddRecipe}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg active:scale-95 transition-transform"
            aria-label="Add recipe"
          >
            <Plus size={26} />
          </button>
        </div>

        {/* Settings */}
        <button
          onClick={() => toast("Settings coming soon")}
          className="flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium text-zinc-400 transition-colors"
        >
          <Settings size={22} />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
}
