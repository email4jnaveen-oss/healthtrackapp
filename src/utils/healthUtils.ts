import type {
  AchievementBadge,
  AppDataState,
  BPCategory,
  BloodPressureEntry,
  VolumeUnit,
  WeightUnit,
} from '../types/health';

export function createId(prefix = 'vt'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function toDateKey(date: Date | number = new Date()): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function toWeekKey(date: Date | number = new Date()): string {
  const d = typeof date === 'number' ? new Date(date) : new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function getLastNDaysKeys(days: number, endDate: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    keys.push(toDateKey(d));
  }
  return keys;
}

export function formatShortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
}

export function formatWeekdayShort(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {weekday: 'short'});
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateTimeInput(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDurationClock(ms: number): string {
  const safeMs = Math.max(0, ms);
  const totalSec = Math.floor(safeMs / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatDurationReadable(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

/**
 * Calculates sleep duration in minutes from HH:mm strings,
 * accurately handling bedtimes before midnight and wake times after midnight.
 */
export function calculateSleepMinutes(bedtime: string, wakeTime: string): number {
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  if (Number.isNaN(bH) || Number.isNaN(bM) || Number.isNaN(wH) || Number.isNaN(wM)) {
    return 0;
  }
  const bedTotal = bH * 60 + bM;
  const wakeTotal = wH * 60 + wM;
  if (wakeTotal >= bedTotal) {
    return wakeTotal - bedTotal;
  }
  return 24 * 60 - bedTotal + wakeTotal;
}

// Unit Conversions
const ML_PER_OZ = 29.5735;
const LB_PER_KG = 2.20462;

export function mlToOz(ml: number): number {
  return Math.round((ml / ML_PER_OZ) * 10) / 10;
}

export function ozToMl(oz: number): number {
  return Math.round(oz * ML_PER_OZ);
}

export function formatVolume(ml: number, unit: VolumeUnit, includeUnit = true): string {
  if (unit === 'oz') {
    const oz = Math.round((ml / ML_PER_OZ) * 10) / 10;
    return includeUnit ? `${oz} oz` : `${oz}`;
  }
  return includeUnit ? `${Math.round(ml).toLocaleString()} ml` : `${Math.round(ml)}`;
}

export function kgToLb(kg: number): number {
  return Math.round(kg * LB_PER_KG * 10) / 10;
}

export function lbToKg(lb: number): number {
  return Math.round((lb / LB_PER_KG) * 10) / 10;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  if (unit === 'lb') {
    return `${kgToLb(kg)} lb`;
  }
  return `${Math.round(kg * 10) / 10} kg`;
}

export interface BPClassification {
  category: BPCategory;
  label: string;
  guidance: string;
  badgeTextClass: string;
  badgeBgClass: string;
  dotColor: string;
}

export function classifyBloodPressure(systolic: number, diastolic: number): BPClassification {
  if (systolic < 90 || diastolic < 60) {
    return {
      category: 'low',
      label: 'Lower range',
      guidance: 'Below 90/60 mmHg',
      badgeTextClass: 'text-sky-700 dark:text-sky-300',
      badgeBgClass: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800/60',
      dotColor: '#0284C7',
    };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return {
      category: 'high_2',
      label: 'High (Stage 2)',
      guidance: '140+ or 90+ mmHg',
      badgeTextClass: 'text-rose-700 dark:text-rose-300',
      badgeBgClass: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60',
      dotColor: '#E11D48',
    };
  }
  if (systolic >= 130 || diastolic >= 80) {
    return {
      category: 'high_1',
      label: 'High (Stage 1)',
      guidance: '130–139 or 80–89 mmHg',
      badgeTextClass: 'text-orange-700 dark:text-orange-300',
      badgeBgClass: 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800/60',
      dotColor: '#EA580C',
    };
  }
  if (systolic >= 120 && diastolic < 80) {
    return {
      category: 'elevated',
      label: 'Elevated',
      guidance: '120–129 and <80 mmHg',
      badgeTextClass: 'text-amber-700 dark:text-amber-300',
      badgeBgClass: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60',
      dotColor: '#D97706',
    };
  }
  return {
    category: 'normal',
    label: 'Normal',
    guidance: '<120 and <80 mmHg',
    badgeTextClass: 'text-emerald-700 dark:text-emerald-300',
    badgeBgClass: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60',
    dotColor: '#059669',
  };
}

export function calculateActiveDaysSet(state: AppDataState): Set<string> {
  const days = new Set<string>();
  state.waterLogs.forEach((w) => days.add(w.dateKey));
  state.sleepLogs.forEach((s) => days.add(s.dateKey));
  state.bpLogs.forEach((b) => days.add(b.dateKey));
  state.fastingLogs.forEach((f) => days.add(f.dateKey));
  state.habitCompletions.forEach((c) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(c.periodKey)) {
      days.add(c.periodKey);
    }
  });
  return days;
}

export function calculateDailyStreak(activeDays: Set<string>, referenceDate: Date = new Date()): number {
  const todayKey = toDateKey(referenceDate);
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  // Streak remains active if user logged today OR yesterday
  let cursor = new Date(referenceDate);
  if (!activeDays.has(todayKey)) {
    if (!activeDays.has(yesterdayKey)) {
      return 0;
    }
    cursor = yesterday;
  }

  let streak = 0;
  while (activeDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function calculateFastingStreak(fastingLogs: AppDataState['fastingLogs'], referenceDate: Date = new Date()): number {
  const daysWithFast = new Set<string>();
  fastingLogs.forEach((f) => {
    if (f.completedTarget) {
      daysWithFast.add(f.dateKey);
    }
  });
  return calculateDailyStreak(daysWithFast, referenceDate);
}

export function computeBadges(state: AppDataState): AchievementBadge[] {
  const activeDays = calculateActiveDaysSet(state);
  const streak = calculateDailyStreak(activeDays);
  const completedFasts = state.fastingLogs.filter((f) => f.completedTarget).length;

  // Check hydration goal hits
  const waterByDay: Record<string, number> = {};
  state.waterLogs.forEach((w) => {
    waterByDay[w.dateKey] = (waterByDay[w.dateKey] ?? 0) + w.amountMl;
  });
  const hydrationGoalDays = Object.values(waterByDay).filter((v) => v >= state.goals.waterDailyMl).length;

  return [
    {
      id: 'first_log',
      title: 'First Step',
      description: 'Log any health metric or habit',
      earned: activeDays.size >= 1,
      progressLabel: activeDays.size >= 1 ? 'Earned' : '0/1 day',
    },
    {
      id: 'streak_7',
      title: '7-Day Streak',
      description: 'Stay active 7 days in a row',
      earned: streak >= 7,
      progressLabel: streak >= 7 ? 'Earned' : `${Math.min(streak, 7)}/7 days`,
    },
    {
      id: 'streak_30',
      title: '30-Day Rhythm',
      description: 'Maintain a 30-day wellness streak',
      earned: streak >= 30,
      progressLabel: streak >= 30 ? 'Earned' : `${Math.min(streak, 30)}/30 days`,
    },
    {
      id: 'hydration_hero',
      title: 'Hydration Hero',
      description: 'Reach daily water goal 5 times',
      earned: hydrationGoalDays >= 5,
      progressLabel: hydrationGoalDays >= 5 ? 'Earned' : `${Math.min(hydrationGoalDays, 5)}/5 goals`,
    },
    {
      id: 'fast_finisher',
      title: 'Fast Finisher',
      description: 'Complete 5 target fasting sessions',
      earned: completedFasts >= 5,
      progressLabel: completedFasts >= 5 ? 'Earned' : `${Math.min(completedFasts, 5)}/5 fasts`,
    },
    {
      id: 'balanced_week',
      title: 'Sleep Guardian',
      description: 'Log 7+ nights of sleep quality',
      earned: state.sleepLogs.length >= 7,
      progressLabel: state.sleepLogs.length >= 7 ? 'Earned' : `${Math.min(state.sleepLogs.length, 7)}/7 nights`,
    },
  ];
}

export function buildCSVExport(state: AppDataState, maxDays?: number): string {
  const cutoffMs = maxDays ? Date.now() - maxDays * 86400000 : 0;
  const rows: string[][] = [
    ['Category', 'Date', 'Time', 'Primary Value', 'Secondary Value', 'Tertiary / Quality', 'Notes'],
  ];

  state.waterLogs
    .filter((w) => w.timestamp >= cutoffMs)
    .forEach((w) => {
      rows.push([
        'Water',
        w.dateKey,
        formatTime(w.timestamp),
        `${w.amountMl} ml`,
        `${mlToOz(w.amountMl)} oz`,
        '',
        '',
      ]);
    });

  state.sleepLogs
    .filter((s) => s.createdAt >= cutoffMs || new Date(s.dateKey).getTime() >= cutoffMs)
    .forEach((s) => {
      rows.push([
        'Sleep',
        s.dateKey,
        `${s.bedtime} - ${s.wakeTime}`,
        `${(s.durationMinutes / 60).toFixed(2)} hrs`,
        `${s.durationMinutes} min`,
        `Quality ${s.quality}/5`,
        s.note ?? '',
      ]);
    });

  state.bpLogs
    .filter((b) => b.timestamp >= cutoffMs)
    .forEach((b) => {
      const cat = classifyBloodPressure(b.systolic, b.diastolic);
      rows.push([
        'Blood Pressure',
        b.dateKey,
        formatTime(b.timestamp),
        `${b.systolic}/${b.diastolic} mmHg`,
        `${b.pulse} bpm`,
        cat.label,
        b.note ?? '',
      ]);
    });

  state.fastingLogs
    .filter((f) => f.endTime >= cutoffMs)
    .forEach((f) => {
      const hrs = ((f.endTime - f.startTime) / 3600000).toFixed(2);
      rows.push([
        'Fasting',
        f.dateKey,
        `${formatTime(f.startTime)} - ${formatTime(f.endTime)}`,
        `${hrs} hrs`,
        `Target ${f.targetHours}h (${f.presetLabel})`,
        f.completedTarget ? 'Target Met' : 'Ended Early',
        '',
      ]);
    });

  return rows
    .map((cols) =>
      cols
        .map((val) => {
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
    .join('\n');
}

export function downloadCSVFile(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function filterHistoryByEntitlement<T extends {timestamp?: number; createdAt?: number; dateKey?: string}>(
  items: T[],
  isPro: boolean,
  freeDays = 7
): {visible: T[]; hiddenCount: number} {
  if (isPro) return {visible: items, hiddenCount: 0};
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - freeDays);
  cutoffDate.setHours(0, 0, 0, 0);
  const cutoffMs = cutoffDate.getTime();

  const visible: T[] = [];
  let hiddenCount = 0;

  for (const item of items) {
    const itemMs =
      item.timestamp ??
      (item.dateKey ? new Date(`${item.dateKey}T12:00:00`).getTime() : item.createdAt ?? Date.now());
    if (itemMs >= cutoffMs) {
      visible.push(item);
    } else {
      hiddenCount += 1;
    }
  }
  return {visible, hiddenCount};
}

export function filterBPReadingsByDays(logs: BloodPressureEntry[], days: number): BloodPressureEntry[] {
  const cutoff = Date.now() - days * 86400000;
  return logs.filter((l) => l.timestamp >= cutoff);
}
