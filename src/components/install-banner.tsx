"use client";

import { useState, useEffect } from "react";
import { ChefHat, Download, X } from "lucide-react";
import { toast } from "sonner";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { IosInstallSheet } from "@/components/ios-install-sheet";

const STORAGE_KEY = "install-banner-dismissed-at";
const COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

export function InstallBanner() {
  const { canPrompt, isIOS, isInstalled, triggerInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
  const [iosSheetOpen, setIosSheetOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const elapsed = Date.now() - parseInt(raw, 10);
      if (elapsed < COOLDOWN_MS) return; // still within cooldown — keep hidden
    }
    setDismissed(false);
  }, []);

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setDismissed(true);
  }

  async function handleInstall() {
    if (isIOS) {
      setIosSheetOpen(true);
    } else {
      setIsInstalling(true);
      const outcome = await triggerInstall();
      setIsInstalling(false);
      setDismissed(true);
      if (outcome === "accepted") {
        toast.success("App installed! Open it from your home screen.");
      }
    }
  }

  // Don't render if: already installed, dismissed, or not installable on this browser
  if (isInstalled || dismissed || (!canPrompt && !isIOS)) return null;

  return (
    <>
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 px-3 pb-1">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-lg">
          {/* App icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900">
            <ChefHat size={20} className="text-white" />
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900">My Recipes</p>
            <p className="text-xs text-zinc-500">Add to your home screen</p>
          </div>

          {/* Install button */}
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
          >
            <Download size={13} />
            {isInstalling ? "Installing…" : isIOS ? "How to" : "Install"}
          </button>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="text-zinc-400 hover:text-zinc-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <IosInstallSheet open={iosSheetOpen} onOpenChange={setIosSheetOpen} />
    </>
  );
}
