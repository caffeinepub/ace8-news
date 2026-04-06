import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isMobile() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    // Reset dismiss after 3 days so users see it again
    const dismissedAt = localStorage.getItem("ace8_pwa_dismissed_at");
    if (!dismissedAt) return false;
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return Date.now() - Number.parseInt(dismissedAt, 10) < threeDays;
  });
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // If already installed as PWA, never show banner
    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    // iOS: show manual instructions banner (no beforeinstallprompt on iOS)
    if (isIOS() && !isDismissed) {
      setShowIOSHint(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    // Fallback: on Android/mobile, show banner even if beforeinstallprompt
    // hasn't fired yet (e.g., already interacted, or delayed)
    // We show a generic banner after 2s if on mobile and not dismissed
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    if (isMobile() && !isDismissed && !isIOS()) {
      fallbackTimer = setTimeout(() => {
        // Only show fallback if native prompt hasn't arrived
        setInstallPrompt((current) => {
          if (!current) {
            // Use a dummy installPrompt to trigger banner display
            // The banner will guide user manually
            setShowIOSHint(false); // not iOS, show android hint
          }
          return current;
        });
      }, 2000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [isDismissed]);

  const installApp = async () => {
    if (!installPrompt) {
      // If no native prompt, open instructions
      if (isIOS()) {
        alert(
          'To install: tap the Share button (rectangle with arrow) in Safari, then tap "Add to Home Screen"',
        );
      } else {
        alert(
          'To install: tap the browser menu (3 dots) and select "Add to Home Screen" or "Install App"',
        );
      }
      return;
    }
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  const dismissBanner = () => {
    setIsDismissed(true);
    setShowIOSHint(false);
    localStorage.setItem("ace8_pwa_dismissed_at", String(Date.now()));
    // Remove old key too
    localStorage.removeItem("ace8_pwa_dismissed");
  };

  const isInstallable =
    !isInstalled &&
    !isDismissed &&
    (!!installPrompt || showIOSHint || isMobile());

  const showBanner = isInstallable;
  const isIOSDevice = isIOS();

  return {
    installApp,
    isInstallable,
    isInstalled,
    showBanner,
    dismissBanner,
    isIOSDevice,
  };
}
