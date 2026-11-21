import {
  Activity,
  BarChart3,
  CheckCircle2,
  Crown,
  Home,
  Settings,
  X,
} from 'lucide-react';
import React from 'react';
import {OfflineIndicator} from './components/common/OfflineIndicator';
import {HomeDashboard} from './components/dashboard/HomeDashboard';
import {InsightsView} from './components/insights/InsightsView';
import {OnboardingFlow} from './components/onboarding/OnboardingFlow';
import {PaywallModal} from './components/paywall/PaywallModal';
import {SettingsView} from './components/settings/SettingsView';
import {TrackView} from './components/trackers/TrackView';
import {VitalTrackProvider, useVitalTrack} from './context/VitalTrackContext';
import type {NavTab} from './types/health';

const NAV_ITEMS: {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{className?: string}>;
}[] = [
  {id: 'home', label: 'Home', icon: Home},
  {id: 'track', label: 'Track', icon: Activity},
  {id: 'insights', label: 'Insights', icon: BarChart3},
  {id: 'settings', label: 'Settings', icon: Settings},
];

const VitalTrackShell: React.FC = () => {
  const {
    state,
    entitlement,
    activeTab,
    setActiveTab,
    openPaywall,
    toast,
    dismissToast,
  } = useVitalTrack();

  if (!state.settings.onboardingCompleted) {
    return (
      <>
        <OfflineIndicator />
        <OnboardingFlow />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col">
      <OfflineIndicator />

      {/* Top App Bar — 3-zone contract */}
      <header className="sticky top-0 z-30 h-[52px] border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md no-print">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            VitalTrack
          </button>

          {/* Zone 2: Desktop Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-slate-950 dark:text-white font-semibold underline decoration-teal-600 decoration-2 underline-offset-8'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Contextual Action */}
          <div className="shrink-0">
            {entitlement.isPro ? (
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 whitespace-nowrap shrink-0"
              >
                <Crown className="h-3.5 w-3.5" />
                <span>Pro</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openPaywall()}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white px-3.5 py-1.5 text-xs font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition whitespace-nowrap shrink-0"
              >
                <Crown className="h-3.5 w-3.5" />
                <span>Go Pro</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-12">
        {activeTab === 'home' && <HomeDashboard />}
        {activeTab === 'track' && <TrackView />}
        {activeTab === 'insights' && <InsightsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Mobile Fixed Bottom Tab Bar */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md pb-safe no-print"
      >
        <div className="grid grid-cols-4 h-16 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex h-full min-h-[44px] flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="h-[22px] w-[22px]" />
                <span className="text-[11px] font-medium tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-50 flex items-start justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-900 dark:bg-slate-800 px-4 py-3 text-white shadow-xl no-print"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <CheckCircle2
              className={`h-4 w-4 shrink-0 mt-0.5 ${
                toast.tone === 'warning'
                  ? 'text-amber-400'
                  : toast.tone === 'success'
                    ? 'text-emerald-400'
                    : 'text-sky-400'
              }`}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-[11px] text-slate-300 leading-snug">
                  {toast.description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <PaywallModal />
    </div>
  );
};

export default function App() {
  return (
    <VitalTrackProvider>
      <VitalTrackShell />
    </VitalTrackProvider>
  );
}
