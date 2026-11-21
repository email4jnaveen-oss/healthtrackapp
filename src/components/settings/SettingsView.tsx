import {
  Bell,
  Crown,
  Database,
  Download,
  FileText,
  Info,
  Lock,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Shield,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import React, {useState} from 'react';
import {useVitalTrack} from '../../context/VitalTrackContext';
import {NotificationService} from '../../services/NotificationService';
import type {AccentTheme, ThemeMode} from '../../types/health';
import {
  buildCSVExport,
  downloadCSVFile,
  kgToLb,
  lbToKg,
  mlToOz,
  ozToMl,
  toDateKey,
} from '../../utils/healthUtils';
import {PWAInstallButton} from '../common/PWAInstallButton';

type LegalDocType = 'privacy' | 'terms' | 'medical' | null;

const ACCENT_THEMES: {id: AccentTheme; label: string; swatch: string; pro: boolean}[] = [
  {id: 'calm', label: 'Calm Teal', swatch: 'bg-teal-600', pro: false},
  {id: 'oceanic', label: 'Oceanic', swatch: 'bg-sky-600', pro: true},
  {id: 'forest', label: 'Botanical', swatch: 'bg-emerald-600', pro: true},
  {id: 'midnight', label: 'Midnight Indigo', swatch: 'bg-indigo-600', pro: true},
];

export const SettingsView: React.FC = () => {
  const {
    state,
    entitlement,
    updateGoals,
    updateSettings,
    updateReminders,
    openPaywall,
    resetProMock,
    toggleDemoData,
    deleteAllData,
    showToast,
  } = useVitalTrack();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType>(null);
  const [permState, setPermState] = useState(() => NotificationService.getPermissionState());

  const [weightInput, setWeightInput] = useState(() => {
    if (!state.goals.weightKg) return '';
    return state.settings.weightUnit === 'lb'
      ? String(kgToLb(state.goals.weightKg))
      : String(state.goals.weightKg);
  });

  const handleWeightBlur = () => {
    const val = Number(weightInput);
    if (!weightInput.trim()) {
      updateGoals({weightKg: undefined});
      return;
    }
    if (!Number.isFinite(val) || val <= 0) return;
    const kg = state.settings.weightUnit === 'lb' ? lbToKg(val) : Math.round(val * 10) / 10;
    updateGoals({weightKg: kg});
  };

  const handleRequestNotifications = async () => {
    const res = await NotificationService.requestPermission();
    setPermState(res);
    if (res === 'granted') {
      showToast('Notifications enabled', undefined, 'success');
    } else if (res === 'denied') {
      showToast('Permission denied', 'Enable notifications in browser settings.', 'warning');
    }
  };

  const handleTestNotification = async () => {
    const sent = await NotificationService.sendNotification(
      'VitalTrack Reminder Test',
      'Your hydration, bedtime, and fasting reminders are working.'
    );
    if (!sent) {
      showToast(
        'In-app reminder test',
        'System notifications unavailable or denied; in-app alerts remain active.'
      );
    }
  };

  const handleCSVExport = () => {
    const maxDays = entitlement.isPro ? undefined : 7;
    const csv = buildCSVExport(state, maxDays);
    downloadCSVFile(`vitaltrack-export-${toDateKey()}.csv`, csv);
    showToast(
      'CSV exported',
      entitlement.isPro ? 'All recorded data downloaded.' : 'Last 7 days downloaded.',
      'success'
    );
  };

  const handleSelectAccentTheme = (themeId: AccentTheme, isProOnly: boolean) => {
    if (isProOnly && !entitlement.isPro) {
      openPaywall('Custom Wellness Themes');
      return;
    }
    updateSettings({accentTheme: themeId});
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Preferences, reminders, offline installation, and data ownership
        </p>
      </div>

      {/* VitalTrack Pro Card */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {entitlement.isPro ? 'VitalTrack Pro Active' : 'VitalTrack Free'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {entitlement.isPro
                  ? `Plan: ${entitlement.activePlan ?? 'Pro'} · Unlimited habits, full history, 90-day charts & PDF export.`
                  : 'Upgrade for unlimited habits, full Sleep/BP history, 90-day charts, and custom themes.'}
              </p>
            </div>
          </div>

          {entitlement.isPro ? (
            <button
              type="button"
              onClick={resetProMock}
              className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              Reset Mock Pro
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openPaywall()}
              className="min-h-[44px] rounded-xl bg-slate-900 dark:bg-white px-5 text-xs font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 whitespace-nowrap"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
      </section>

      {/* Install PWA Card (auto-hides if already standalone) */}
      <PWAInstallButton variant="card" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Units & Daily Goals */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Units &amp; Daily Goals
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Volume Unit
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                {(['ml', 'oz'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => updateSettings({volumeUnit: u})}
                    className={`min-h-[40px] rounded-lg text-xs font-semibold uppercase transition ${
                      state.settings.volumeUnit === u
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Weight Unit
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                {(['kg', 'lb'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      updateSettings({weightUnit: u});
                      if (state.goals.weightKg) {
                        setWeightInput(
                          u === 'lb'
                            ? String(kgToLb(state.goals.weightKg))
                            : String(state.goals.weightKg)
                        );
                      }
                    }}
                    className={`min-h-[40px] rounded-lg text-xs font-semibold uppercase transition ${
                      state.settings.weightUnit === u
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Daily Water Goal ({state.settings.volumeUnit})
              </label>
              <input
                type="number"
                value={
                  state.settings.volumeUnit === 'oz'
                    ? Math.round(mlToOz(state.goals.waterDailyMl))
                    : state.goals.waterDailyMl
                }
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!Number.isFinite(val) || val <= 0) return;
                  const ml =
                    state.settings.volumeUnit === 'oz' ? ozToMl(val) : Math.round(val);
                  if (ml >= 500 && ml <= 10000) {
                    updateGoals({waterDailyMl: ml});
                  }
                }}
                className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Sleep Target (hours)
              </label>
              <input
                type="number"
                step={0.5}
                min={4}
                max={12}
                value={state.goals.sleepTargetHours}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (Number.isFinite(val) && val >= 4 && val <= 12) {
                    updateGoals({sleepTargetHours: val});
                  }
                }}
                className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Body Weight Reference ({state.settings.weightUnit}, optional)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder={state.settings.weightUnit === 'lb' ? 'e.g. 158' : 'e.g. 72'}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onBlur={handleWeightBlur}
              className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 text-sm tabular-nums text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </section>

        {/* Appearance & Themes */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Appearance</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Color Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  {id: 'light', label: 'Light', icon: Sun},
                  {id: 'dark', label: 'Dark', icon: Moon},
                  {id: 'system', label: 'System', icon: Monitor},
                ] as {id: ThemeMode; label: string; icon: React.ComponentType<{className?: string}>}[]
              ).map((opt) => {
                const Icon = opt.icon;
                const active = state.settings.theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateSettings({theme: opt.id})}
                    className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Accent Palette
              </label>
              {!entitlement.isPro && (
                <span className="text-[11px] font-medium text-teal-600 dark:text-teal-400">
                  Pro unlocks custom palettes
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {ACCENT_THEMES.map((t) => {
                const locked = t.pro && !entitlement.isPro;
                const active =
                  (entitlement.isPro ? state.settings.accentTheme : 'calm') === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectAccentTheme(t.id, t.pro)}
                    className={`flex min-h-[44px] items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-3.5 w-3.5 rounded-full ${t.swatch}`} />
                      <span>{t.label}</span>
                    </span>
                    {locked && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Reminders */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Reminders</h2>
            </div>
            <div className="flex items-center gap-2">
              {permState !== 'granted' && permState !== 'unsupported' && (
                <button
                  type="button"
                  onClick={handleRequestNotifications}
                  className="min-h-[40px] rounded-xl bg-slate-900 dark:bg-white px-3 text-xs font-semibold text-white dark:text-slate-900"
                >
                  Enable Alerts
                </button>
              )}
              <button
                type="button"
                onClick={handleTestNotification}
                className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Test
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Water Reminder */}
            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Water Check-ins
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Every {state.settings.reminders.waterIntervalHours}h ({state.settings.reminders.waterStartHour}:00–{state.settings.reminders.waterEndHour}:00)
                </p>
              </div>
              <input
                type="checkbox"
                aria-label="Toggle water reminders"
                checked={state.settings.reminders.waterEnabled}
                onChange={(e) => updateReminders({waterEnabled: e.target.checked})}
                className="h-5 w-5 accent-teal-600 rounded"
              />
            </div>

            {/* Bedtime Reminder */}
            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Bedtime Wind-Down
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scheduled daily alert
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="time"
                  value={state.settings.reminders.bedtimeTime}
                  onChange={(e) => updateReminders({bedtimeTime: e.target.value})}
                  className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs tabular-nums text-slate-900 dark:text-white"
                />
                <input
                  type="checkbox"
                  aria-label="Toggle bedtime reminder"
                  checked={state.settings.reminders.bedtimeEnabled}
                  onChange={(e) => updateReminders({bedtimeEnabled: e.target.checked})}
                  className="h-5 w-5 accent-indigo-600 rounded"
                />
              </div>
            </div>

            {/* Fasting Start Reminder */}
            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Fasting Start Prompt
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daily start window alert
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="time"
                  value={state.settings.reminders.fastingStartTime}
                  onChange={(e) => updateReminders({fastingStartTime: e.target.value})}
                  className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs tabular-nums text-slate-900 dark:text-white"
                />
                <input
                  type="checkbox"
                  aria-label="Toggle fasting start reminder"
                  checked={state.settings.reminders.fastingStartEnabled}
                  onChange={(e) => updateReminders({fastingStartEnabled: e.target.checked})}
                  className="h-5 w-5 accent-emerald-600 rounded"
                />
              </div>
            </div>

            {/* Fasting End Reminder */}
            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Fasting Goal Reached
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Notify when active fast hits target hours
                </p>
              </div>
              <input
                type="checkbox"
                aria-label="Toggle fasting end reminder"
                checked={state.settings.reminders.fastingEndEnabled}
                onChange={(e) => updateReminders({fastingEndEnabled: e.target.checked})}
                className="h-5 w-5 accent-emerald-600 rounded"
              />
            </div>
          </div>
        </section>

        {/* Data & Privacy */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Data &amp; Backup
            </h2>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleCSVExport}
              className="flex w-full min-h-[46px] items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 px-4 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
            >
              <span className="flex items-center gap-2.5">
                <Download className="h-4 w-4 text-slate-500" />
                <span>Export Data (CSV)</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {entitlement.isPro ? 'All history' : 'Last 7 days'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!entitlement.isPro) {
                  openPaywall('PDF Health Report Export');
                  return;
                }
                window.print();
              }}
              className="flex w-full min-h-[46px] items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 px-4 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
            >
              <span className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-slate-500" />
                <span>Printable PDF Summary</span>
              </span>
              {!entitlement.isPro ? (
                <Lock className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <span className="text-xs text-teal-600 dark:text-teal-400">Print / PDF</span>
              )}
            </button>

            <button
              type="button"
              onClick={toggleDemoData}
              className="flex w-full min-h-[46px] items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 px-4 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
            >
              <span className="flex items-center gap-2.5">
                <RotateCcw className="h-4 w-4 text-slate-500" />
                <span>
                  {state.settings.demoDataLoaded ? 'Unload Demo Data' : 'Load Demo Data (35 Days)'}
                </span>
              </span>
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                {state.settings.demoDataLoaded ? 'Active' : 'Populate'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex w-full min-h-[46px] items-center justify-between rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 px-4 text-sm font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 transition"
            >
              <span className="flex items-center gap-2.5">
                <Trash2 className="h-4 w-4" />
                <span>Delete All Data</span>
              </span>
              <span className="text-xs opacity-75">Irreversible</span>
            </button>
          </div>
        </section>
      </div>

      {/* Legal & Medical Disclaimer */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex items-start gap-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
          <p>
            <strong>Medical Disclaimer:</strong> VitalTrack is designed exclusively for general
            wellness tracking and personal habit awareness. It is not a medical device and does not
            diagnose, treat, cure, or prevent any disease. Always consult a qualified physician for
            medical guidance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setLegalDoc('privacy')}
            className="min-h-[40px] flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline underline-offset-2"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Privacy Policy</span>
          </button>
          <button
            type="button"
            onClick={() => setLegalDoc('terms')}
            className="min-h-[40px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline underline-offset-2"
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => setLegalDoc('medical')}
            className="min-h-[40px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline underline-offset-2"
          >
            Full Medical Notice
          </button>
        </div>
      </section>

      {/* Delete All Confirmation Modal */}
      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Delete all local data?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              This will permanently erase all water logs, sleep logs, blood pressure readings,
              fasting history, and custom habits stored on this device.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAllData();
                  setConfirmDelete(false);
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Info Modal */}
      {legalDoc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {legalDoc === 'privacy'
                  ? 'Privacy Policy'
                  : legalDoc === 'terms'
                    ? 'Terms of Service'
                    : 'Medical Disclaimer'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalDoc(null)}
                aria-label="Close document"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {legalDoc === 'privacy' && (
                <>
                  <p>
                    <strong>Local-First Storage:</strong> VitalTrack stores all health entries,
                    goals, and preferences directly in your browser&apos;s local storage on your
                    device. No account registration is required and no personal health logs are
                    transmitted to external servers.
                  </p>
                  <p>
                    <strong>Exports &amp; Deletion:</strong> You have complete ownership of your
                    records. You may export your history to CSV at any time or permanently erase all
                    data from Settings.
                  </p>
                </>
              )}
              {legalDoc === 'terms' && (
                <>
                  <p>
                    By using VitalTrack, you acknowledge that this application is provided as a
                    personal wellness logging tool on an &ldquo;as-is&rdquo; basis.
                  </p>
                  <p>
                    Optional VitalTrack Pro features are managed through your selected app store or
                    local billing provider. Trials and subscriptions may be canceled before renewal.
                  </p>
                </>
              )}
              {legalDoc === 'medical' && (
                <>
                  <p>
                    VitalTrack does not offer medical advice, clinical diagnosis, or treatment
                    recommendations. Blood pressure category labels reflect general adult reference
                    thresholds for personal awareness only.
                  </p>
                  <p>
                    If you experience unusually high or low blood pressure readings, dizziness, or
                    other symptoms, seek prompt advice from a licensed healthcare professional.
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setLegalDoc(null)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-slate-900 dark:bg-white text-xs font-semibold text-white dark:text-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
