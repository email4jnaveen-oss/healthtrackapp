import {Moon, Star, Trash2} from 'lucide-react';
import React, {useMemo, useState} from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {useVitalTrack} from '../../context/VitalTrackContext';
import {
  calculateSleepMinutes,
  filterHistoryByEntitlement,
  formatDurationReadable,
  formatShortDate,
  formatWeekdayShort,
  getLastNDaysKeys,
  toDateKey,
} from '../../utils/healthUtils';
import {ProGateOverlay} from '../common/ProGateOverlay';

const QUALITY_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Restorative',
};

export const SleepTracker: React.FC = () => {
  const {state, entitlement, addSleepEntry, deleteSleepEntry, openPaywall} = useVitalTrack();

  const [dateKey, setDateKey] = useState(toDateKey());
  const [bedtime, setBedtime] = useState('22:45');
  const [wakeTime, setWakeTime] = useState('06:45');
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const previewMinutes = useMemo(
    () => calculateSleepMinutes(bedtime, wakeTime),
    [bedtime, wakeTime]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateKey) {
      setError('Please select a wake date.');
      return;
    }
    if (previewMinutes < 30 || previewMinutes > 20 * 60) {
      setError('Sleep duration must be between 30 minutes and 20 hours.');
      return;
    }
    setError(null);
    addSleepEntry({
      dateKey,
      bedtime,
      wakeTime,
      durationMinutes: previewMinutes,
      quality,
      note: note.trim() || undefined,
    });
    setNote('');
  };

  // 7-day chart & averages
  const last7Keys = useMemo(() => getLastNDaysKeys(7), []);
  const chartData = useMemo(() => {
    return last7Keys.map((dk) => {
      const entries = state.sleepLogs.filter((s) => s.dateKey === dk);
      const totalMins = entries.reduce((sum, s) => sum + s.durationMinutes, 0);
      return {
        dateKey: dk,
        day: formatWeekdayShort(dk),
        hours: Math.round((totalMins / 60) * 10) / 10,
      };
    });
  }, [last7Keys, state.sleepLogs]);

  const recent7Logs = useMemo(
    () => state.sleepLogs.filter((s) => last7Keys.includes(s.dateKey)),
    [state.sleepLogs, last7Keys]
  );

  const avg7Hours = useMemo(() => {
    if (recent7Logs.length === 0) return 0;
    const total = recent7Logs.reduce((sum, s) => sum + s.durationMinutes, 0);
    return Math.round((total / recent7Logs.length / 60) * 10) / 10;
  }, [recent7Logs]);

  const avgQuality = useMemo(() => {
    if (recent7Logs.length === 0) return 0;
    const total = recent7Logs.reduce((sum, s) => sum + s.quality, 0);
    return Math.round((total / recent7Logs.length) * 10) / 10;
  }, [recent7Logs]);

  const {visible: visibleLogs, hiddenCount} = useMemo(
    () => filterHistoryByEntitlement(state.sleepLogs, entitlement.isPro, 7),
    [state.sleepLogs, entitlement.isPro]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Manual Sleep Entry Form */}
        <section className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Moon className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-wide">Sleep Log</span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            Record Night&apos;s Rest
          </h2>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Wake-Up Date
              </label>
              <input
                type="date"
                value={dateKey}
                max={toDateKey()}
                onChange={(e) => setDateKey(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Bedtime
                </label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 text-sm tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Wake Time
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 text-sm tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 px-4 py-3">
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                Computed Duration
              </span>
              <span className="text-base font-bold tabular-nums text-indigo-900 dark:text-indigo-100">
                {formatDurationReadable(previewMinutes)}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Sleep Quality
                </label>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {quality}/5 · {QUALITY_LABELS[quality]}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {([1, 2, 3, 4, 5] as const).map((rating) => {
                  const active = quality === rating;
                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setQuality(rating)}
                      aria-label={`Sleep quality ${rating} of 5: ${QUALITY_LABELS[rating]}`}
                      className={`flex min-h-[44px] items-center justify-center gap-1 rounded-xl border text-sm font-semibold tabular-nums transition ${
                        active
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Star className={`h-3.5 w-3.5 ${active ? 'fill-current' : ''}`} />
                      <span>{rating}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Optional Note
              </label>
              <input
                type="text"
                maxLength={120}
                placeholder="e.g. Woke up refreshed, late dinner..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.98]"
            >
              Save Sleep Log
            </button>
          </form>
        </section>

        {/* 7-Day Sleep Bar Chart + History */}
        <section className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  7-Day Sleep Duration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target: {state.goals.sleepTargetHours}h per night
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">7-Day Avg</p>
                  <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {avg7Hours > 0 ? `${avg7Hours}h` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Avg Quality</p>
                  <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {avgQuality > 0 ? `${avgQuality}/5` : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{top: 8, right: 8, left: -20, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#64748B', fontSize: 12}}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 12]}
                    tick={{fill: '#64748B', fontSize: 12}}
                  />
                  <Tooltip
                    cursor={{fill: 'rgba(99, 102, 241, 0.08)'}}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      fontSize: 12,
                    }}
                    formatter={(val: unknown) => [`${val} hrs`, 'Sleep']}
                  />
                  <Bar dataKey="hours" fill="#4F46E5" radius={[8, 8, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Sleep History
              </h3>
              {!entitlement.isPro && (
                <button
                  type="button"
                  onClick={() => openPaywall('Full Sleep History')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  7-day limit · Unlock all
                </button>
              )}
            </div>

            {state.sleepLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No sleep sessions logged yet
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Log your bedtime and wake time to see your 7-day trend.
                </p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleLogs.slice(0, 12).map((item) => (
                    <li
                      key={item.id}
                      className="flex min-h-[60px] items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                          <span className="tabular-nums">
                            {formatDurationReadable(item.durationMinutes)}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            Quality {item.quality}/5
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          <span>{formatShortDate(item.dateKey)}</span>
                          <span>·</span>
                          <span>
                            {item.bedtime} – {item.wakeTime}
                          </span>
                          {item.note && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[180px]">{item.note}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteSleepEntry(item.id)}
                        aria-label="Delete sleep log"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>

                {hiddenCount > 0 && (
                  <div className="mt-4">
                    <ProGateOverlay
                      locked={true}
                      featureName="Full Sleep History"
                      description={`${hiddenCount} older sleep ${hiddenCount === 1 ? 'entry is' : 'entries are'} archived beyond your 7-day free window.`}
                      minHeightClass="min-h-[150px]"
                    >
                      <div className="space-y-2 p-4">
                        <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                        <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                      </div>
                    </ProGateOverlay>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
