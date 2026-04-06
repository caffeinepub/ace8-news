import { Download, Smartphone, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePWAInstall } from "../hooks/usePWAInstall";

export function InstallBanner() {
  const { showBanner, installApp, dismissBanner } = usePWAInstall();

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50"
          data-ocid="pwa.panel"
        >
          {/* Backdrop blur strip */}
          <div className="bg-news-red shadow-2xl border-t-2 border-red-400/30">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 bg-white/20 rounded-full p-2">
                <Smartphone className="w-5 h-5 text-white" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">
                  📱 Install ACE8 NEWS App
                </p>
                <p className="text-red-100 text-xs mt-0.5 leading-tight">
                  Get faster access to Indian news — works offline too!
                </p>
              </div>

              {/* Install button */}
              <button
                type="button"
                onClick={installApp}
                data-ocid="pwa.primary_button"
                className="flex-shrink-0 flex items-center gap-1.5 bg-white text-news-red font-bold text-sm px-3 py-2 rounded-full shadow-md hover:bg-red-50 transition-colors active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden">Install</span>
              </button>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={dismissBanner}
                data-ocid="pwa.close_button"
                className="flex-shrink-0 text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Dismiss install banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
