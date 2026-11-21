import {Download, FileText, Lock} from 'lucide-react';
import React, {useMemo, useState} from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
  buildCSVExport,
  downloadCSVFile,
  formatShortDate,
  getLastNDaysKeys,
  mlToOz,
  toDateKey,
} from '../../utils/healthUtils';
import {ProGateOverlay} from '../common/ProGateOverlay';

type RangeOption = 7 | 30 | 90;

export const InsightsView: React.FC = () => {
  const {state, entitlement, openPaywall, showToast} = useVitalTrack();
  const [range, setRange] = useState<RangeOption>(7);
  const unit = state.settings.volumeUnit;

  const isRangeLocked = range > 7 && !entitlement.isPro;
  const dateKeys = useMemo(() => getLastNDaysKeys(range), [range]);

  const waterSeries = useMemo(() => {
    return dateKeys.map((dk) => {
      const ml = state.waterLogs
        .filter((w) => w.dateKey === dk)
        .reduce((sum, w) => sum + w.amountMl, 0);
      return {
        label: formatShortDate(dk),
        value: unit === 'oz' ? mlToOz(ml) : ml,
      };
    });
  }, [dateKeys, state.waterLogs, unit]);

  const sleepSeries = useMemo(() => {
    return dateKeys.map((dk) => {
      const entries = state.sleepLogs.filter((s) => s.dateKey === dk);
      const mins = entries.reduce((sum, s) => sum + s.durationMinutes, 0);
      return {
        label: formatShortDate(dk),
        hours: Math.round((mins / 60) * 10) / 10,
      };
    });
  }, [dateKeys, state.sleepLogs]);

  const bpSeries = useMemo(() => {
    const cutoff = Date.now() - range * 86400000;
    return state.bpLogs
      .filter((b) => b.timestamp >= cutoff)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((b) => ({
        label: formatShortDate(b.dateKey),
        systolic: b.systolic,
        diastolic: b.diastolic,
      }));
  }, [state.bpLogs, range]);

  const fastingSeries = useMemo(() => {
    return dateKeys.map((dk) => {
      const entries = state.fastingLogs.filter((f) => f.dateKey === dk);
      const hrs = entries.reduce(
        (sum, f) => sum + (f.endTime - f.startTime) / 3600000,
        0
      );
      return {
        label: formatShortDate(dk),
        hours: Math.round(hrs * 10) / 10,
      };
    });
  }, [dateKeys, state.fastingLogs]);

  const handleCSVExport = () => {
    const maxDays = entitlement.isPro ? undefined : 7;
    const csv = buildCSVExport(state, maxDays);
    downloadCSVFile(`vitaltrack-export-${toDateKey()}.csv`, csv);
    showToast(
      'CSV exported',
      entitlement.isPro ? 'Full history downloaded.' : 'Last 7 days downloaded.',
      'success'
    );
  };

  const handlePDFExport = () => {
    if (!entitlement.isPro) {
      openPaywall('PDF Health Report Export');
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Insights &amp; Trends
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Analyze long-term patterns across hydration, sleep, blood pressure, and fasting
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
            {([7, 30, 90] as const).map((days) => {
              const locked = days > 7 && !entitlement.isPro;
              const active = range === days;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRange(days)}
                  className={`inline-flex min-h-[40px] items-center gap-1 rounded-xl px-3 text-xs font-semibold transition whitespace-nowrap ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {locked && <Lock className="h-3 w-3 opacity-75" />}
                  <span>{days}D</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleCSVExport}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePDFExport}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition whitespace-nowrap"
          >
            {!entitlement.isPro ? <Lock className="h-3.5 w-3.5" /> : <FileText className="h-4 w-4" />}
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* Charts Grid (30D & 90D locked behind tasteful ProGateOverlay for Free users) */}
      <ProGateOverlay
        locked={isRangeLocked}
        featureName={`${range}-Day Deep Insights`}
        description="Unlock 30-day and 90-day multi-metric charts, full history archives, and PDF exports with VitalTrack Pro."
        minHeightClass="min-h-[420px]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hydration Chart */}
          <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Hydration ({unit})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Last {range} days daily intake
                </p>
              </div>
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Water</span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={waterSeries} margin={{top: 8, right: 8, left: -16, bottom: 0}}>
                  <defs>
                    <linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284C7" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" strokeOpacity={0.2} />
                  <XAxis dataKey="label" tick={{fill: '#64748B', fontSize: 11}} axisLine={false} tickLine={false} minTickGap={20} />
                  <YAxis tick={{fill: '#64748B', fontSize: 11}} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid rgba(148,163,184,0.25)',
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={`Intake (${unit})`}
                    stroke="#0284C7"
                    strokeWidth={2}
                    fill="url(#waterFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Sleep Chart */}
          <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Sleep Duration (hours)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Last {range} days nightly rest
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Sleep</span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleepSeries} margin={{top: 8, right: 8, left: -16, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" strokeOpacity={0.2} />
                  <XAxis dataKey="label" tick={{fill: '#64748B', fontSize: 11}} axisLine={false} tickLine={false} minTickGap={20} />
                  <YAxis tick={{fill: '#64748B', fontSize: 11}} axisLine={false} tickLine={false} domain={[0, 12]} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid rgba(148,163,184,0.25)',
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="hours" name="Hours" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Blood Pressure Chart */}
          <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Blood Pressure (mmHg)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Systolic &amp; diastolic readings over {range} days
                </p>
              </div>
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Vitals</span>
            </div>
            {bpSeries.length === 0 ? (
              <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                No blood pressure readings in this window.
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bpSeries} margin={{top: 8, right: 8, left: -16, bottom: 0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" strokeOpacity={0.2} />
                    <XAxis dataKey="label" tick={{fill: '#64748B', fontSize: 11}} axisLine={false} tickLine={false} minTickGap={20} />
                    <YAxis tick={{fill: '#64748B', fontSize: 11}} axisLine={false} tickLine={false} domain={[50, 'auto']} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(148,163,184,0.25)',
                        backgroundColor: '#0F172A',
                        color: '#F8FAFC',
                        fontSize: 12,
                      }}
                    />
                    <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#E11D48" strokeWidth={2} dot={{r: 3}} />
                    <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#64748B" strokeWidth={2} dot={{r: 3}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Fasting Chart */}
          <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Fasting Hours Completed
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daily fasting duration over {range} days
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Fasting</span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fastingSeries} margin={{top: 8, right: 8, left: -16, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" strokeOpacity={0.2} />
                  <XAxis dataKey="label" tick={{fill: '#64748B', fontSize: 11}} axisLine={false} tickLine={false} minTickGap={20} />
                  <YAxis tick={{fill: '#64748B', fontSize: 11}} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid rgba(148,163,184,0.25)',
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="hours" name="Fasting Hours" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </ProGateOverlay>
    </div>
  );
};
