import {Download, Share, X} from 'lucide-react';
import React, {useState} from 'react';
import {usePWAInstall} from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({variant = 'compact'}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (variant === 'card') {
      return (
        <button
          type="button"
          onClick={install}
          className="flex w-full min-h-[48px] items-center justify-between rounded-2xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-left transition hover:bg-teal-100/80 dark:border-teal-800/60 dark:bg-teal-950/40 dark:hover:bg-teal-900/40"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Install VitalTrack App
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Add to home screen for instant offline access
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 whitespace-nowrap">
            Install
          </span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 whitespace-nowrap shrink-0"
      >
        <Download className="h-4 w-4" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            variant === 'card'
              ? 'flex w-full min-h-[48px] items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/70'
              : 'inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 whitespace-nowrap shrink-0'
          }
        >
          <span className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Install on iOS</span>
          </span>
          {variant === 'card' && (
            <span className="text-xs text-slate-500 dark:text-slate-400">Guide</span>
          )}
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Install on iPhone or iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close installation guide"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ol className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="font-semibold text-slate-900 dark:text-white">1.</span>
                  <span>
                    Tap the <Share className="inline h-4 w-4 mx-0.5" /> <strong>Share</strong> button in Safari&apos;s toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-semibold text-slate-900 dark:text-white">2.</span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-semibold text-slate-900 dark:text-white">3.</span>
                  <span>
                    Launch VitalTrack anytime, even completely offline.
                  </span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
