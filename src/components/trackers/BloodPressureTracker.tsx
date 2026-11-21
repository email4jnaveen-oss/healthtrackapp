import {AlertCircle, HeartPulse, Info, Trash2} from 'lucide-react';
import React, {useMemo, useState} from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {useVitalTrack} from '../../context/VitalTrackContext';
import {
  classifyBloodPressure,
  filterHistoryByEntitlement,
  formatDateTimeInput,
  formatShortDate,
  formatTime,
  toDateKey,
} from '../../utils/healthUtils';
import {ProGateOverlay} from '../common/ProGateOverlay';

export const BloodPressureTracker: React.FC = () => {
  const {state, entitlement, addBPEntry, deleteBPEntry, openPaywall} = useVitalTrack();

  const [systolic, setSystolic] = useState('118');
  const [diastolic, setDiastolic] = useState('76');
  const [pulse, setPulse] = useState('68');
  const [dateTimeStr, setDateTimeStr] = useState(() => formatDateTimeInput(Date.now()));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sysNum = Number(systolic);
  const diaNum = Number(diastolic);
  const pulseNum = Number(pulse);

  const livePreview = useMemo(() => {
    if (!Number.isFinite(sysNum) || !Number.isFinite(diaNum) || sysNum <= 0 || diaNum <= 0) {
      return null;
    }
    return classifyBloodPressure(sysNum, diaNum);
  }, [sysNum, diaNum]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(sysNum) || sysNum < 60 || sysNum > 260) {
      setError('Systolic pressure must be between 60 and 260 mmHg.');
      return;
    }
    if (!Number.isFinite(diaNum) || diaNum < 35 || diaNum > 160) {
      setError('Diastolic pressure must be between 35 and 160 mmHg.');
      return;
    }
    if (sysNum <= diaNum + 5) {
      setError('Systolic reading should be higher than diastolic reading.');
      return;
    }
    if (!Number.isFinite(pulseNum) || pulseNum < 30 || pulseNum > 220) {
      setError('Pulse must be between 30 and 220 bpm.');
      return;
    }
    const ts = new Date(dateTimeStr).getTime();
    if (Number.isNaN(ts)) {
      setError('Please enter a valid date and time.');
      return;
    }

    setError(null);
    addBPEntry({
      systolic: Math.round(sysNum),
      diastolic: Math.round(diaNum),
      pulse: Math.round(pulseNum),
      timestamp: ts,
      dateKey: toDateKey(ts),
      note: note.trim() || undefined,
    });
    setNote('');
    setDateTimeStr(formatDateTimeInput(Date.now()));
  };

  const {visible: visibleLogs, hiddenCount} = useMemo(
    () => filterHistoryByEntitlement(state.bpLogs, entitlement.isPro, 7),
    [state.bpLogs, entitlement.isPro]
  );

  const chartData = useMemo(() => {
    const source = entitlement.isPro ? state.bpLogs.slice(0, 30) : visibleLogs;
    return [...source]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((item) => ({
        label: formatShortDate(item.dateKey),
        systolic: item.systolic,
        diastolic: item.diastolic,
        pulse: item.pulse,
      }));
  }, [state.bpLogs, visibleLogs, entitlement.isPro]);

  return (
    <div className="space-y-6">
      {/* Medical Disclaimer Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-4 text-xs leading-relaxed text-rose-900 dark:text-rose-200">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
        <p>
          <strong>Not medical advice:</strong> Category labels follow general adult blood pressure
          reference ranges for personal logging only. Always consult a qualified healthcare
          professional before making health decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <section className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <HeartPulse className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-wide">Blood Pressure</span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            Log Reading
          </h2>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Systolic
                </label>
                <input
                  type="number"
                  min={60}
                  max={260}
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-base font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="mt-1 block text-[11px] text-slate-400">mmHg</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Diastolic
                </label>
                <input
                  type="number"
                  min={35}
                  max={160}
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-base font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="mt-1 block text-[11px] text-slate-400">mmHg</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Pulse
                </label>
                <input
                  type="number"
                  min={30}
                  max={220}
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-base font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="mt-1 block text-[11px] text-slate-400">bpm</span>
              </div>
            </div>

            {livePreview && (
              <div
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${livePreview.badgeBgClass}`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className={`h-4 w-4 ${livePreview.badgeTextClass}`} />
                  <span className={`text-xs font-semibold ${livePreview.badgeTextClass}`}>
                    {livePreview.label}
                  </span>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                  {livePreview.guidance}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={dateTimeStr}
                onChange={(e) => setDateTimeStr(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 text-sm tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Optional Note
              </label>
              <input
                type="text"
                maxLength={120}
                placeholder="e.g. Left arm, seated 5 min..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-rose-600 text-sm font-semibold text-white transition hover:bg-rose-700 active:scale-[0.98]"
            >
              Save Reading
            </button>
          </form>
        </section>

        {/* Trend Line Chart & Readings List */}
        <section className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Blood Pressure Trend
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Systolic (red) and Diastolic (slate) in mmHg
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-rose-600" />
                  Systolic
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-slate-500" />
                  Diastolic
                </span>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="mt-5 flex h-52 items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                Log at least 1 reading to visualize your trend line.
              </div>
            ) : (
              <div className="mt-5 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{top: 8, right: 12, left: -20, bottom: 0}}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#94A3B8"
                      strokeOpacity={0.2}
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: '#64748B', fontSize: 12}}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      domain={[50, 'auto']}
                      tick={{fill: '#64748B', fontSize: 12}}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        backgroundColor: '#0F172A',
                        color: '#F8FAFC',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="systolic"
                      name="Systolic"
                      stroke="#E11D48"
                      strokeWidth={2.5}
                      dot={{r: 3.5, fill: '#E11D48'}}
                    />
                    <Line
                      type="monotone"
                      dataKey="diastolic"
                      name="Diastolic"
                      stroke="#64748B"
                      strokeWidth={2.5}
                      dot={{r: 3.5, fill: '#64748B'}}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Recorded Readings
              </h3>
              {!entitlement.isPro && (
                <button
                  type="button"
                  onClick={() => openPaywall('Full Blood Pressure History')}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  7-day limit · Unlock all
                </button>
              )}
            </div>

            {state.bpLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No blood pressure readings yet
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Enter systolic, diastolic, and pulse values to track your baseline.
                </p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleLogs.slice(0, 14).map((item) => {
                    const cls = classifyBloodPressure(item.systolic, item.diastolic);
                    return (
                      <li
                        key={item.id}
                        className="flex min-h-[60px] items-center justify-between gap-3 py-3"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
                              {item.systolic}/{item.diastolic} mmHg
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                            <span className="text-xs tabular-nums text-slate-600 dark:text-slate-300">
                              {item.pulse} bpm
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                            <span className={`text-xs font-semibold ${cls.badgeTextClass}`}>
                              {cls.label}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            <span>{formatShortDate(item.dateKey)}</span>
                            <span>·</span>
                            <span>{formatTime(item.timestamp)}</span>
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
                          onClick={() => deleteBPEntry(item.id)}
                          aria-label="Delete reading"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {hiddenCount > 0 && (
                  <div className="mt-4">
                    <ProGateOverlay
                      locked={true}
                      featureName="Full Blood Pressure History"
                      description={`${hiddenCount} older ${hiddenCount === 1 ? 'reading is' : 'readings are'} stored beyond your 7-day free history.`}
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
