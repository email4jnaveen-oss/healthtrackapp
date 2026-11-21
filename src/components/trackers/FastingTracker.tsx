import {CheckCircle2, Flame, Play, Square, Timer, Trash2} from 'lucide-react';
import React, {useEffect, useMemo, useState} from 'react';
import {useVitalTrack} from '../../context/VitalTrackContext';
import {
  calculateFastingStreak,
  formatDurationClock,
  formatShortDate,
  formatTime,
} from '../../utils/healthUtils';
import {ProgressRing} from '../common/ProgressRing';

const FASTING_PRESETS = [
  {label: '12:12', hours: 12, subtitle: 'Circadian'},
  {label: '14:10', hours: 14, subtitle: 'Gentle'},
  {label: '16:8', hours: 16, subtitle: 'Classic'},
  {label: '18:6', hours: 18, subtitle: 'Extended'},
] as const;

export const FastingTracker: React.FC = () => {
  const {state, startFast, stopFast, deleteFastingEntry} = useVitalTrack();
  const activeFast = state.activeFast;

  const [selectedPreset, setSelectedPreset] = useState<string>(state.goals.defaultFastingPreset);
  const [customHours, setCustomHours] = useState<string>(String(state.goals.defaultFastingHours));
  const [earlierMinutes, setEarlierMinutes] = useState<string>('0');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  // Recompute elapsed time from timestamps every second — resilient to sleep/close/midnight
  useEffect(() => {
    if (!activeFast) return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeFast]);

  const fastingStreak = useMemo(
    () => calculateFastingStreak(state.fastingLogs),
    [state.fastingLogs]
  );

  const targetHours = useMemo(() => {
    const found = FASTING_PRESETS.find((p) => p.label === selectedPreset);
    if (found) return found.hours;
    const parsed = Number(customHours);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 16;
  }, [selectedPreset, customHours]);

  const handleStart = () => {
    if (selectedPreset === 'Custom') {
      const hrs = Number(customHours);
      if (!Number.isFinite(hrs) || hrs < 4 || hrs > 72) {
        setError('Custom fast duration must be between 4 and 72 hours.');
        return;
      }
    }
    const backdateMin = Number(earlierMinutes) || 0;
    if (backdateMin < 0 || backdateMin > 720) {
      setError('Start offset must be between 0 and 720 minutes.');
      return;
    }
    setError(null);
    const startTs = Date.now() - backdateMin * 60000;
    startFast(targetHours, selectedPreset, startTs);
    setEarlierMinutes('0');
  };

  const elapsedMs = activeFast ? Math.max(0, nowMs - activeFast.startTime) : 0;
  const targetMs = activeFast ? activeFast.targetHours * 3600000 : targetHours * 3600000;
  const remainingMs = Math.max(0, targetMs - elapsedMs);
  const progress = activeFast && targetMs > 0 ? Math.min(1, elapsedMs / targetMs) : 0;
  const targetReached = activeFast ? elapsedMs >= targetMs : false;
  const expectedEndMs = activeFast ? activeFast.startTime + targetMs : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Timer Card */}
        <section className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Timer className="h-5 w-5" />
                <span className="text-xs font-semibold tracking-wide">Intermittent Fasting</span>
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {activeFast ? `${activeFast.presetLabel} Fast in Progress` : 'Ready to Start Fast'}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
              <Flame className="h-4 w-4" />
              <span>{fastingStreak}-day streak</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-8">
            <ProgressRing
              progress={progress}
              size={200}
              strokeWidth={14}
              strokeColor={targetReached ? '#10B981' : '#059669'}
            >
              {activeFast ? (
                <>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {targetReached ? 'Target Reached · Elapsed' : 'Remaining'}
                  </span>
                  <span className="mt-1 font-mono-num text-2xl font-bold text-slate-900 dark:text-white">
                    {targetReached
                      ? formatDurationClock(elapsedMs)
                      : formatDurationClock(remainingMs)}
                  </span>
                  <span className="mt-1 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                    Elapsed: {formatDurationClock(elapsedMs)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Selected Goal
                  </span>
                  <span className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                    {targetHours}h
                  </span>
                  <span className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {selectedPreset}
                  </span>
                </>
              )}
            </ProgressRing>

            <div className="w-full flex-1 space-y-4">
              {!activeFast ? (
                <>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                      Choose Protocol
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {FASTING_PRESETS.map((preset) => {
                        const isSelected = selectedPreset === preset.label;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setSelectedPreset(preset.label)}
                            className={`min-h-[48px] rounded-2xl border px-3 py-2 text-left transition ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="block text-sm font-bold tabular-nums">
                              {preset.label}
                            </span>
                            <span className="block text-[11px] opacity-75">{preset.subtitle}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setSelectedPreset('Custom')}
                        className={`min-h-[48px] rounded-2xl border px-3 py-2 text-left transition ${
                          selectedPreset === 'Custom'
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="block text-sm font-bold">Custom</span>
                        <span className="block text-[11px] opacity-75">4–72 hours</span>
                      </button>
                    </div>
                  </div>

                  {selectedPreset === 'Custom' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Target Fasting Hours
                      </label>
                      <input
                        type="number"
                        min={4}
                        max={72}
                        value={customHours}
                        onChange={(e) => setCustomHours(e.target.value)}
                        className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Already started? Offset (minutes ago)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={720}
                      value={earlierMinutes}
                      onChange={(e) => setEarlierMinutes(e.target.value)}
                      className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 text-sm tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleStart}
                    className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Start Fast</span>
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-800">
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Started</p>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatShortDate(
                          `${new Date(activeFast.startTime).getFullYear()}-${String(
                            new Date(activeFast.startTime).getMonth() + 1
                          ).padStart(2, '0')}-${String(
                            new Date(activeFast.startTime).getDate()
                          ).padStart(2, '0')}`
                        )}{' '}
                        · {formatTime(activeFast.startTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Goal Target</p>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        {expectedEndMs ? formatTime(expectedEndMs) : '—'} ({activeFast.targetHours}h)
                      </p>
                    </div>
                  </div>

                  {targetReached && (
                    <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Target completed! Timer continues until you end your fast.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => stopFast(true)}
                    className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-[0.98]"
                  >
                    <Square className="h-4 w-4 fill-current" />
                    <span>{targetReached ? 'Complete & Save Fast' : 'End Fast Early'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Fasting History */}
        <section className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Completed Fasts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {state.fastingLogs.length} recorded sessions
              </p>
            </div>
          </div>

          {state.fastingLogs.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center px-4">
              <Timer className="h-7 w-7 text-emerald-500 mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No completed fasts yet
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Your timer runs accurately even when the app is closed or crosses midnight.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[360px] overflow-y-auto pr-1">
              {state.fastingLogs.slice(0, 20).map((entry) => {
                const durHrs = ((entry.endTime - entry.startTime) / 3600000).toFixed(1);
                return (
                  <li
                    key={entry.id}
                    className="flex min-h-[58px] items-center justify-between gap-3 py-2.5"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <span className="tabular-nums">{durHrs}h</span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {entry.presetLabel}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span
                          className={`text-xs font-semibold ${
                            entry.completedTarget
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {entry.completedTarget ? 'Target Met' : 'Partial'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatShortDate(entry.dateKey)} · {formatTime(entry.startTime)} –{' '}
                        {formatTime(entry.endTime)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteFastingEntry(entry.id)}
                      aria-label="Delete fast entry"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
