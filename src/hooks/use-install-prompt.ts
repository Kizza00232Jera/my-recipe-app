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
      // Wait for appinstalled AND a minimum 2s delay before resolving.
      // Promise.all ensures both conditions are met:
      //   - appinstalled fires (or 30s safety timeout if the browser never fires it)
      //   - at least 2 seconds have passed so the "Installing…" state is visible
      await Promise.all([
        Promise.race([
          new Promise<void>((resolve) => {
            window.addEventListener("appinstalled", () => resolve(), { once: true });
          }),
          new Promise<void>((resolve) => setTimeout(resolve, 30_000)),
        ]),
        new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
      ]);
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
    return outcome;
  }

  return { canPrompt: deferredPrompt !== null, isIOS, isInstalled, triggerInstall };
}
