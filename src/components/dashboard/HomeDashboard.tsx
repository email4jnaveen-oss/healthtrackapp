import {
  Award,
  Bell,
  Check,
  Droplets,
  Flame,
  HeartPulse,
  Lock,
  Moon,
  Plus,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import React, {useEffect, useMemo, useState} from 'react';
import {useVitalTrack} from '../../context/VitalTrackContext';
import type {HabitFrequency} from '../../types/health';
import {
  calculateActiveDaysSet,
  calculateDailyStreak,
  calculateFastingStreak,
  classifyBloodPressure,
  computeBadges,
  formatDurationClock,
  formatDurationReadable,
  formatVolume,
  getGreeting,
  toDateKey,
  toWeekKey,
} from '../../utils/healthUtils';
import {HABIT_ICON_OPTIONS, HabitIcon} from '../common/HabitIcon';
import {PWAInstallButton} from '../common/PWAInstallButton';
import {ProGateOverlay} from '../common/ProGateOverlay';
import {ProgressRing} from '../common/ProgressRing';

export const HomeDashboard: React.FC = () => {
  const {
    state,
    entitlement,
    openTracker,
    openPaywall,
    addWater,
    addHabit,
    toggleHabitCompletion,
    deleteHabit,
  } = useVitalTrack();

  const todayKey = toDateKey();
  const weekKey = toWeekKey();
  const unit = state.settings.volumeUnit;

  // Live tick if a fast is active
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (!state.activeFast) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.activeFast]);

  // Add Habit Modal State
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitIcon, setHabitIcon] = useState<string>('Sun');
  const [habitFreq, setHabitFreq] = useState<HabitFrequency>('daily');
  const [habitError, setHabitError] = useState<string | null>(null);

  const todayWaterMl = useMemo(
    () =>
      state.waterLogs
        .filter((w) => w.dateKey === todayKey)
        .reduce((sum, w) => sum + w.amountMl, 0),
    [state.waterLogs, todayKey]
  );

  const latestSleep = useMemo(() => {
    return (
      state.sleepLogs.find((s) => s.dateKey === todayKey) ?? state.sleepLogs[0] ?? null
    );
  }, [state.sleepLogs, todayKey]);

  const latestBP = useMemo(() => state.bpLogs[0] ?? null, [state.bpLogs]);
  const bpClass = latestBP
    ? classifyBloodPressure(latestBP.systolic, latestBP.diastolic)
    : null;

  const activeDays = useMemo(() => calculateActiveDaysSet(state), [state]);
  const overallStreak = useMemo(() => calculateDailyStreak(activeDays), [activeDays]);
  const fastingStreak = useMemo(
    () => calculateFastingStreak(state.fastingLogs),
    [state.fastingLogs]
  );
  const badges = useMemo(() => computeBadges(state), [state]);

  const waterProgress =
    state.goals.waterDailyMl > 0 ? todayWaterMl / state.goals.waterDailyMl : 0;

  const activeFastElapsed = state.activeFast
    ? Math.max(0, nowMs - state.activeFast.startTime)
    : 0;
  const activeFastTargetMs = state.activeFast
    ? state.activeFast.targetHours * 3600000
    : 1;
  const activeFastRemaining = Math.max(0, activeFastTargetMs - activeFastElapsed);

  const completedHabitsCount = useMemo(() => {
    return state.habits.filter((h) => {
      const pk = h.frequency === 'daily' ? todayKey : weekKey;
      return state.habitCompletions.some((c) => c.habitId === h.id && c.periodKey === pk);
    }).length;
  }, [state.habits, state.habitCompletions, todayKey, weekKey]);

  const handleOpenAddHabit = () => {
    if (!entitlement.isPro && state.habits.length >= 3) {
      openPaywall('Unlimited Custom Habits');
      return;
    }
    setHabitError(null);
    setHabitName('');
    setShowHabitModal(true);
  };

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (habitName.trim().length < 2) {
      setHabitError('Enter a habit name (at least 2 characters).');
      return;
    }
    const added = addHabit(habitName, habitIcon, habitFreq);
    if (added) {
      setShowHabitModal(false);
    }
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Greeting Header + Streak Summary */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {formattedDate}
          </p>
          <h1 className="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Daily Streak
              </p>
              <p className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
                {overallStreak} {overallStreak === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>

          <PWAInstallButton variant="compact" />
        </div>
      </section>

      {/* 4 Core Tracker Summary Cards */}
      <section aria-label="Today's summary">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Water Card */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between transition hover:border-sky-300 dark:hover:border-sky-800">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => openTracker('water')}
                className="text-left flex-1 focus-visible:outline-none"
              >
                <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                  <Droplets className="h-4 w-4" />
                  <span className="text-xs font-semibold">Water</span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatVolume(todayWaterMl, unit)}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  Goal {formatVolume(state.goals.waterDailyMl, unit)}
                </p>
              </button>

              <ProgressRing progress={waterProgress} size={58} strokeWidth={6} strokeColor="#0284C7">
                <span className="text-[11px] font-bold tabular-nums text-slate-700 dark:text-slate-200">
                  {Math.min(100, Math.round(waterProgress * 100))}%
                </span>
              </ProgressRing>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => addWater(unit === 'oz' ? 237 : 250)}
                className="flex-1 min-h-[44px] rounded-xl bg-sky-50 dark:bg-sky-950/50 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition tabular-nums"
              >
                {unit === 'oz' ? '+8 oz' : '+250 ml'}
              </button>
              <button
                type="button"
                onClick={() => openTracker('water')}
                className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Open
              </button>
            </div>
          </div>

          {/* Sleep Card */}
          <button
            type="button"
            onClick={() => openTracker('sleep')}
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-left flex flex-col justify-between transition hover:border-indigo-300 dark:hover:border-indigo-800"
          >
            <div>
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Moon className="h-4 w-4" />
                <span className="text-xs font-semibold">Sleep</span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {latestSleep ? formatDurationReadable(latestSleep.durationMinutes) : '—'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {latestSleep
                  ? `Quality ${latestSleep.quality}/5 · ${latestSleep.bedtime}–${latestSleep.wakeTime}`
                  : `Target ${state.goals.sleepTargetHours}h per night`}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-medium text-indigo-600 dark:text-indigo-400">
              <span>{latestSleep ? 'View 7-day trend' : 'Log last night'}</span>
              <span>→</span>
            </div>
          </button>

          {/* Blood Pressure Card */}
          <button
            type="button"
            onClick={() => openTracker('bp')}
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-left flex flex-col justify-between transition hover:border-rose-300 dark:hover:border-rose-800"
          >
            <div>
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <HeartPulse className="h-4 w-4" />
                <span className="text-xs font-semibold">Blood Pressure</span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : '—'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {latestBP && bpClass ? (
                  <>
                    <span className={`font-semibold ${bpClass.badgeTextClass}`}>
                      {bpClass.label}
                    </span>
                    <span> · {latestBP.pulse} bpm</span>
                  </>
                ) : (
                  'No readings recorded'
                )}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-medium text-rose-600 dark:text-rose-400">
              <span>{latestBP ? 'Log new reading' : 'Record reading'}</span>
              <span>→</span>
            </div>
          </button>

          {/* Fasting Card */}
          <button
            type="button"
            onClick={() => openTracker('fasting')}
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-left flex flex-col justify-between transition hover:border-emerald-300 dark:hover:border-emerald-800"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Timer className="h-4 w-4" />
                  <span className="text-xs font-semibold">Fasting</span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                  {fastingStreak}d streak
                </span>
              </div>
              <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-white">
                {state.activeFast
                  ? formatDurationClock(activeFastRemaining)
                  : `${state.goals.defaultFastingPreset}`}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {state.activeFast
                  ? `Remaining of ${state.activeFast.targetHours}h fast`
                  : `${state.fastingLogs.length} fasts completed`}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span>{state.activeFast ? 'View live ring' : 'Start timer'}</span>
              <span>→</span>
            </div>
          </button>
        </div>
      </section>

      {/* Habits & Achievements Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Habits Checklist */}
        <section className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Today&apos;s Habits
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {completedHabitsCount}/{state.habits.length} completed
                {!entitlement.isPro && ` · Free plan (${state.habits.length}/3 habits)`}
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddHabit}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition whitespace-nowrap"
            >
              {!entitlement.isPro && state.habits.length >= 3 ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>Add Habit</span>
            </button>
          </div>

          <div className="mt-4">
            {state.habits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center px-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Build your daily wellness routine
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add custom daily or weekly habits like morning walks, supplements, or stretching.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddHabit}
                  className="mt-4 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Create your first habit
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.habits.map((habit) => {
                  const periodKey = habit.frequency === 'daily' ? todayKey : weekKey;
                  const completed = state.habitCompletions.some(
                    (c) => c.habitId === habit.id && c.periodKey === periodKey
                  );
                  return (
                    <li
                      key={habit.id}
                      className="flex min-h-[60px] items-center justify-between gap-3 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => toggleHabitCompletion(habit.id)}
                        className="flex flex-1 min-h-[44px] items-center gap-3 text-left group"
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border transition ${
                            completed
                              ? 'border-teal-600 bg-teal-600 text-white'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-transparent group-hover:border-teal-500'
                          }`}
                        >
                          <Check className="h-4 w-4" />
                        </span>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <HabitIcon name={habit.icon} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium truncate transition ${
                              completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {habit.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                            {habit.frequency}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteHabit(habit.id)}
                        aria-label={`Remove habit ${habit.name}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Achievement Badges */}
        <section className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Milestones
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {badges.filter((b) => b.earned).length} of {badges.length} unlocked
              </p>
            </div>
            <Award className="h-5 w-5 text-amber-500" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`rounded-2xl border p-3.5 transition ${
                  badge.earned
                    ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/25'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      badge.earned
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Award className="h-4 w-4" />
                  </span>
                  <span
                    className={`text-[11px] font-semibold tabular-nums ${
                      badge.earned
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {badge.progressLabel}
                  </span>
                </div>
                <p className="mt-2.5 text-xs font-semibold text-slate-900 dark:text-white">
                  {badge.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Home-Screen Widget-Style Reminders (Pro Feature) */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Quick Reminder Widget
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            At-a-glance daily schedule
          </span>
        </div>

        <ProGateOverlay
          locked={!entitlement.isPro}
          featureName="Home-Screen Widget Reminders"
          description="Keep your hydration cadence, bedtime wind-down, and fasting window pinned right on your home dashboard."
          minHeightClass="min-h-[120px]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
              <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">Hydration</p>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                {state.settings.reminders.waterEnabled
                  ? `Every ${state.settings.reminders.waterIntervalHours}h (${state.settings.reminders.waterStartHour}:00–${state.settings.reminders.waterEndHour}:00)`
                  : 'Paused'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Bedtime</p>
              <p className="mt-1 text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                {state.settings.reminders.bedtimeEnabled
                  ? state.settings.reminders.bedtimeTime
                  : 'Not scheduled'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Fasting Alert</p>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                {state.settings.reminders.fastingEndEnabled
                  ? 'Notify on goal completion'
                  : 'Muted'}
              </p>
            </div>
          </div>
        </ProGateOverlay>
      </section>

      {/* Add Habit Modal */}
      {showHabitModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                New Custom Habit
              </h3>
              <button
                type="button"
                onClick={() => setShowHabitModal(false)}
                aria-label="Close modal"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Habit Name
                </label>
                <input
                  type="text"
                  maxLength={48}
                  placeholder="e.g. 10-minute morning stretch"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Frequency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['daily', 'weekly'] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setHabitFreq(freq)}
                      className={`min-h-[44px] rounded-xl border text-xs font-semibold capitalize transition ${
                        habitFreq === freq
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {HABIT_ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setHabitIcon(opt.id)}
                      aria-label={opt.label}
                      className={`flex min-h-[44px] items-center justify-center rounded-xl border transition ${
                        habitIcon === opt.id
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <HabitIcon name={opt.id} className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              {habitError && (
                <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  {habitError}
                </p>
              )}

              <button
                type="submit"
                className="w-full min-h-[48px] rounded-xl bg-slate-900 dark:bg-white text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition"
              >
                Save Habit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
