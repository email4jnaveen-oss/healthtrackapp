import {ArrowRight, Bell, Check, Droplets, Moon, Shield, Timer} from 'lucide-react';
import React, {useState} from 'react';
import {useVitalTrack} from '../../context/VitalTrackContext';
import {NotificationService} from '../../services/NotificationService';
import type {VolumeUnit} from '../../types/health';
import {mlToOz, ozToMl} from '../../utils/healthUtils';
import {PWAInstallButton} from '../common/PWAInstallButton';

export const OnboardingFlow: React.FC = () => {
  const {state, completeOnboarding, updateReminders, showToast} = useVitalTrack();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [unit, setUnit] = useState<VolumeUnit>(state.settings.volumeUnit);
  const [waterGoal, setWaterGoal] = useState<number>(state.goals.waterDailyMl);
  const [sleepGoal, setSleepGoal] = useState<number>(state.goals.sleepTargetHours);
  const [fastingPreset, setFastingPreset] = useState<string>(state.goals.defaultFastingPreset);
  const [permState, setPermState] = useState(() => NotificationService.getPermissionState());

  const handleRequestNotifications = async () => {
    const res = await NotificationService.requestPermission();
    setPermState(res);
    if (res === 'granted') {
      updateReminders({waterEnabled: true, bedtimeEnabled: true, fastingEndEnabled: true});
      showToast('Reminders enabled', 'You can fine-tune schedules anytime in Settings.', 'success');
    } else if (res === 'denied') {
      showToast('Notifications blocked', 'In-app reminders will still appear while open.', 'warning');
    }
  };

  const handleFinish = () => {
    const presetHoursMap: Record<string, number> = {
      '12:12': 12,
      '14:10': 14,
      '16:8': 16,
      '18:6': 18,
    };
    completeOnboarding(
      {
        waterDailyMl: waterGoal,
        sleepTargetHours: sleepGoal,
        defaultFastingPreset: fastingPreset,
        defaultFastingHours: presetHoursMap[fastingPreset] ?? 16,
      },
      unit
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] dark:bg-[#0B0F17] px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="VitalTrack" className="h-7 w-7 rounded-lg" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">VitalTrack</span>
          </div>
          <div className="flex items-center gap-1.5" aria-label={`Step ${step} of 3`}>
            {[1, 2, 3].map((idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === step
                    ? 'w-6 bg-teal-600'
                    : idx < step
                      ? 'w-3 bg-teal-400'
                      : 'w-3 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Screen 1: Welcome & Privacy */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Calm, private daily health tracking.
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Track hydration, sleep, blood pressure, intermittent fasting, and daily habits in
                one distraction-free space.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    100% Offline &amp; Device-Local
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No account or cloud login required. All logs stay on your device unless you
                    export them.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Droplets className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Four Core Trackers + Habits
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Quick one-tap hydration, sleep quality logs, blood pressure trends, and
                    timestamp-accurate fasting timers.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-white text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition"
            >
              <span>Set Your Goals</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Screen 2: Daily Goals & Units */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Personalize your targets
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                You can adjust these anytime in Settings.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hydration Unit
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['ml', 'oz'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={`min-h-[44px] rounded-xl border text-xs font-semibold uppercase transition ${
                        unit === u
                          ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {u === 'ml' ? 'Milliliters (ml)' : 'Fluid Ounces (oz)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Droplets className="h-4 w-4 text-sky-600" />
                    <span>Daily Water Goal</span>
                  </label>
                  <span className="text-sm font-bold tabular-nums text-sky-600 dark:text-sky-400">
                    {unit === 'oz' ? `${Math.round(mlToOz(waterGoal))} oz` : `${waterGoal} ml`}
                  </span>
                </div>
                <input
                  type="range"
                  min={1500}
                  max={4500}
                  step={unit === 'oz' ? ozToMl(4) : 250}
                  value={waterGoal}
                  onChange={(e) => setWaterGoal(Number(e.target.value))}
                  className="w-full accent-sky-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Moon className="h-4 w-4 text-indigo-600" />
                    <span>Nightly Sleep Target</span>
                  </label>
                  <span className="text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                    {sleepGoal} hours
                  </span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={10}
                  step={0.5}
                  value={sleepGoal}
                  onChange={(e) => setSleepGoal(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Timer className="h-4 w-4 text-emerald-600" />
                  <span>Default Fasting Schedule</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['12:12', '14:10', '16:8', '18:6'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFastingPreset(preset)}
                      className={`min-h-[44px] rounded-xl border text-xs font-semibold tabular-nums transition ${
                        fastingPreset === preset
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[48px] rounded-2xl border border-slate-200 dark:border-slate-700 px-5 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 min-h-[48px] rounded-2xl bg-slate-900 dark:bg-white text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Screen 3: Permissions & Install */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Reminders &amp; offline access
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Optional gentle nudges for water, bedtime, and fasting milestones.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Browser Notifications
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {permState === 'granted'
                        ? 'Permission granted'
                        : permState === 'denied'
                          ? 'Blocked in browser settings'
                          : permState === 'unsupported'
                            ? 'In-app reminders active'
                            : 'Allow gentle wellness reminders'}
                    </p>
                  </div>
                </div>

                {permState === 'granted' ? (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    <Check className="h-4 w-4" />
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={permState === 'unsupported' || permState === 'denied'}
                    onClick={handleRequestNotifications}
                    className="min-h-[44px] rounded-xl bg-slate-900 dark:bg-white px-4 text-xs font-semibold text-white dark:text-slate-900 disabled:opacity-40 whitespace-nowrap"
                  >
                    Allow
                  </button>
                )}
              </div>

              <PWAInstallButton variant="card" />
            </div>

            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              VitalTrack is a personal wellness logger and does not provide medical advice.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[48px] rounded-2xl border border-slate-200 dark:border-slate-700 px-5 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 min-h-[48px] rounded-2xl bg-teal-600 text-sm font-semibold text-white hover:bg-teal-700 transition"
              >
                Start Tracking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
