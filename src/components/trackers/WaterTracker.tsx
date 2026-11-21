import {Droplets, Minus, Plus, RotateCcw, Trash2} from 'lucide-react';
import React, {useMemo, useState} from 'react';
import {useVitalTrack} from '../../context/VitalTrackContext';
import {
  formatTime,
  formatVolume,
  mlToOz,
  ozToMl,
  toDateKey,
} from '../../utils/healthUtils';
import {ProgressRing} from '../common/ProgressRing';

export const WaterTracker: React.FC = () => {
  const {state, addWater, undoLastWater, deleteWaterEntry, updateGoals, showToast} =
    useVitalTrack();
  const unit = state.settings.volumeUnit;
  const todayKey = toDateKey();

  const todayLogs = useMemo(
    () => state.waterLogs.filter((w) => w.dateKey === todayKey),
    [state.waterLogs, todayKey]
  );

  const todayTotalMl = useMemo(
    () => todayLogs.reduce((sum, w) => sum + w.amountMl, 0),
    [todayLogs]
  );

  const goalMl = state.goals.waterDailyMl;
  const progress = goalMl > 0 ? todayTotalMl / goalMl : 0;
  const pct = Math.min(100, Math.round(progress * 100));

  const [customInput, setCustomInput] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(() =>
    unit === 'oz' ? String(Math.round(mlToOz(goalMl))) : String(goalMl)
  );
  const [error, setError] = useState<string | null>(null);

  const presetsMl = unit === 'oz' ? [148, 237, 503] : [150, 250, 500];

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(customInput);
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter a positive amount.');
      return;
    }
    const ml = unit === 'oz' ? ozToMl(num) : Math.round(num);
    if (ml < 10 || ml > 5000) {
      setError(`Enter a realistic single intake (${unit === 'oz' ? '1–169 oz' : '10–5,000 ml'}).`);
      return;
    }
    setError(null);
    addWater(ml);
    setCustomInput('');
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(goalDraft);
    const ml = unit === 'oz' ? ozToMl(num) : Math.round(num);
    if (!Number.isFinite(num) || ml < 500 || ml > 10000) {
      setError(`Goal should be between ${unit === 'oz' ? '17–338 oz' : '500–10,000 ml'}.`);
      return;
    }
    setError(null);
    updateGoals({waterDailyMl: ml});
    setEditingGoal(false);
    showToast('Water goal updated', formatVolume(ml, unit), 'success');
  };

  const adjustGoalQuick = (deltaMl: number) => {
    const next = Math.max(500, Math.min(10000, goalMl + deltaMl));
    updateGoals({waterDailyMl: next});
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Ring & Quick Add Card */}
        <section className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Droplets className="h-5 w-5" />
                <span className="text-xs font-semibold tracking-wide">Hydration</span>
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                Today&apos;s Water Intake
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setGoalDraft(
                  unit === 'oz' ? String(Math.round(mlToOz(goalMl))) : String(goalMl)
                );
                setEditingGoal((v) => !v);
                setError(null);
              }}
              className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition whitespace-nowrap"
            >
              {editingGoal ? 'Cancel' : `Goal: ${formatVolume(goalMl, unit)}`}
            </button>
          </div>

          {editingGoal && (
            <form
              onSubmit={handleSaveGoal}
              className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4"
            >
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Daily Hydration Target ({unit})
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustGoalQuick(-250)}
                  aria-label="Decrease goal"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  step="any"
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  className="h-11 w-28 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => adjustGoalQuick(250)}
                  aria-label="Increase goal"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="submit"
                  className="ml-auto min-h-[44px] rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition"
                >
                  Save Goal
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-8">
            <ProgressRing progress={progress} size={184} strokeWidth={14} strokeColor="#0284C7">
              <span className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                {pct}%
              </span>
              <span className="mt-1 text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
                {formatVolume(todayTotalMl, unit)}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                of {formatVolume(goalMl, unit)}
              </span>
            </ProgressRing>

            <div className="w-full flex-1 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Quick Add
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {presetsMl.map((ml) => {
                    const label =
                      unit === 'oz' ? `+${Math.round(mlToOz(ml))} oz` : `+${ml} ml`;
                    return (
                      <button
                        key={ml}
                        type="button"
                        onClick={() => addWater(ml)}
                        className="min-h-[48px] rounded-2xl border border-sky-200 dark:border-sky-800/70 bg-sky-50/70 dark:bg-sky-950/40 px-3 py-2.5 text-sm font-semibold tabular-nums text-sky-700 dark:text-sky-300 transition hover:bg-sky-100 dark:hover:bg-sky-900/50 active:scale-[0.97]"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleCustomAdd} className="space-y-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Custom Amount ({unit})
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder={unit === 'oz' ? 'e.g. 12' : 'e.g. 330'}
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="min-h-[44px] flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 text-sm tabular-nums text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.98] whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
              </form>

              {error && (
                <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Today's Log + Undo */}
        <section className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Today&apos;s Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {todayLogs.length} {todayLogs.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
            <button
              type="button"
              onClick={undoLastWater}
              disabled={todayLogs.length === 0}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Undo Last</span>
            </button>
          </div>

          <div className="mt-4 flex-1">
            {todayLogs.length === 0 ? (
              <div className="flex h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center px-4">
                <Droplets className="h-7 w-7 text-sky-400 mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No water logged yet today
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Tap a quick-add button to start your daily hydration ring.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[320px] overflow-y-auto pr-1">
                {todayLogs.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex min-h-[52px] items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                        <Droplets className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                          {formatVolume(entry.amountMl, unit)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {formatTime(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteWaterEntry(entry.id)}
                      aria-label={`Remove ${formatVolume(entry.amountMl, unit)} entry`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
