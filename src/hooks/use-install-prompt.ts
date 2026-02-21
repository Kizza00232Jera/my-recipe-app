"use client";

import { useEffect, useState } from "react";

// TypeScript doesn't include BeforeInstallPromptEvent in its lib
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS (iPhone / iPad / iPod)
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    // Detect already installed (standalone mode)
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const iosStandalone = (navigator as { standalone?: boolean }).standalone === true;
    setIsInstalled(standaloneQuery.matches || iosStandalone);

    // Listen for the install prompt (Android / Desktop Chrome/Edge)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful install
    const installedHandler = () => setIsInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  async function triggerInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
    if (!deferredPrompt) return "unavailable";
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      // Wait for the browser to finish installing before resolving.
      // 30 s timeout is a safety net for browsers that never fire appinstalled.
      await Promise.race([
        new Promise<void>((resolve) => {
          window.addEventListener("appinstalled", () => resolve(), { once: true });
        }),
        new Promise<void>((resolve) => setTimeout(resolve, 30_000)),
      ]);
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
    return outcome;
  }

  return { canPrompt: deferredPrompt !== null, isIOS, isInstalled, triggerInstall };
}
