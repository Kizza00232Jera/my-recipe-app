"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, FolderOpen, Plus, List, Settings, LogIn } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type BottomNavProps = {
  onAddRecipe: () => void;
  isDemo?: boolean;
};

export function BottomNav({ onAddRecipe, isDemo = false }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-100 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-around px-2 pb-safe">
        {/* Home */}
        <button
          onClick={() => router.push("/")}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-3 text-xs font-semibold transition-colors",
            pathname === "/" ? "text-primary" : "text-zinc-400"
          )}
        >
          <Home size={22} className={cn(pathname === "/" && "fill-brand-soft")} />
          <span>Home</span>
        </button>

        {/* Folders */}
        <button
          onClick={() => router.push("/folders")}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-3 text-xs font-semibold transition-colors",
            pathname === "/folders" ? "text-primary" : "text-zinc-400"
          )}
        >
          <FolderOpen size={22} />
          <span>Folders</span>
        </button>

        {/* Add Recipe / Sign in — prominent center button */}
        <div className="-mt-5 flex flex-col items-center">
          {isDemo ? (
            <Link
              href="/sign-in"
              className="bg-primary text-primary-foreground flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-green-600/30 transition-transform active:scale-95"
              aria-label="Sign in"
            >
              <LogIn size={24} />
            </Link>
          ) : (
            <button
              onClick={onAddRecipe}
              className="text-primary-foreground flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-green-600/30 transition-transform active:scale-95"
              aria-label="Add recipe"
            >
              <Plus size={26} />
            </button>
          )}
        </div>

        {/* List (coming soon) */}
        <button
          onClick={() => toast("List view coming soon")}
          className="flex flex-col items-center gap-1 px-3 py-3 text-xs font-semibold text-zinc-400 transition-colors"
        >
          <List size={22} />
          <span>List</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => toast("Settings coming soon")}
          className="flex flex-col items-center gap-1 px-3 py-3 text-xs font-semibold text-zinc-400 transition-colors"
        >
          <Settings size={22} />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
}
