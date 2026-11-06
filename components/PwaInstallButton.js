"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

function subscribeToNoChanges() {
  return () => {};
}

function getIOSSnapshot() {
  return (
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1)
  );
}

function getInstalledSnapshot() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function getServerSnapshot() {
  return false;
}

export default function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installedInSession, setInstalledInSession] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const isIOS = useSyncExternalStore(
    subscribeToNoChanges,
    getIOSSnapshot,
    getServerSnapshot,
  );
  const isStandalone = useSyncExternalStore(
    subscribeToNoChanges,
    getInstalledSnapshot,
    getServerSnapshot,
  );
  const isInstalled = installedInSession || isStandalone;

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallPrompt(event);
    }

    function handleAppInstalled() {
      setInstallPrompt(null);
      setInstalledInSession(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator &&
      window.isSecureContext
    ) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } catch (error) {
      console.error("Unable to show the app installation prompt:", error);
      setInstallPrompt(null);
    }
  }

  return (
    <>
      {!isInstalled && (isIOS || installPrompt) && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="min-h-11 whitespace-nowrap rounded-xl border border-violet-200 bg-white px-3 text-xs font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50 sm:px-4"
        >
          Install App
        </button>
      )}

      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="ios-install-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Add ResearchPilot to Home Screen
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  In Safari, tap Share, then choose Add to Home Screen and
                  confirm.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSInstructions(false)}
                aria-label="Close installation instructions"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSInstructions(false)}
              className="mt-4 min-h-11 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Got it
            </button>
          </section>
        </div>
      )}
    </>
  );
}
