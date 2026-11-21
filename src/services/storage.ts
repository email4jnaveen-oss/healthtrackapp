import type {
  AppDataState,
  BloodPressureEntry,
  FastingEntry,
  Habit,
  HabitCompletion,
  SleepEntry,
  WaterEntry,
} from '../types/health';
import {calculateSleepMinutes, createId, toDateKey, toWeekKey} from '../utils/healthUtils';

const STORAGE_KEY = 'vitaltrack_app_state_v1';
const CURRENT_VERSION = 1;

export function createInitialAppState(): AppDataState {
  return {
    version: CURRENT_VERSION,
    waterLogs: [],
    sleepLogs: [],
    bpLogs: [],
    activeFast: null,
    fastingLogs: [],
    habits: [],
    habitCompletions: [],
    goals: {
      waterDailyMl: 2500,
      sleepTargetHours: 8,
      defaultFastingPreset: '16:8',
      defaultFastingHours: 16,
    },
    settings: {
      volumeUnit: 'ml',
      weightUnit: 'kg',
      theme: 'system',
      accentTheme: 'calm',
      onboardingCompleted: false,
      demoDataLoaded: false,
      reminders: {
        waterEnabled: false,
        waterIntervalHours: 2,
        waterStartHour: 8,
        waterEndHour: 20,
        bedtimeEnabled: false,
        bedtimeTime: '22:30',
        fastingStartEnabled: false,
        fastingStartTime: '20:00',
        fastingEndEnabled: true,
      },
    },
  };
}

/**
 * StorageRepository abstracts local persistence.
 * Uses localStorage today and can be swapped to IndexedDB or a cloud sync API later
 * without changing UI components.
 */
export const StorageRepository = {
  loadState(): AppDataState {
    const fallback = createInitialAppState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<AppDataState>;
      return {
        ...fallback,
        ...parsed,
        goals: {
          ...fallback.goals,
          ...(parsed.goals ?? {}),
        },
        settings: {
          ...fallback.settings,
          ...(parsed.settings ?? {}),
          reminders: {
            ...fallback.settings.reminders,
            ...(parsed.settings?.reminders ?? {}),
          },
        },
      };
    } catch {
      return fallback;
    }
  },

  saveState(state: AppDataState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors cleanly
    }
  },

  clearAll(): AppDataState {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    const fresh = createInitialAppState();
    return fresh;
  },
};

/**
 * Explicitly invoked ONLY when the user clicks "Load Demo Data" in Settings.
 * Generates 35 days of realistic, deterministic wellness logs for testing charts & streaks.
 */
export function buildDemoData(current: AppDataState): AppDataState {
  const now = new Date();
  const waterLogs: WaterEntry[] = [];
  const sleepLogs: SleepEntry[] = [];
  const bpLogs: BloodPressureEntry[] = [];
  const fastingLogs: FastingEntry[] = [];
  const habitCompletions: HabitCompletion[] = [];

  const demoHabits: Habit[] = [
    {id: 'demo_h1', name: 'Morning sunlight (10m)', icon: 'Sun', frequency: 'daily', createdAt: now.getTime() - 35 * 86400000},
    {id: 'demo_h2', name: '20-minute brisk walk', icon: 'Footprints', frequency: 'daily', createdAt: now.getTime() - 35 * 86400000},
    {id: 'demo_h3', name: 'No screens 30m before bed', icon: 'Moon', frequency: 'daily', createdAt: now.getTime() - 35 * 86400000},
  ];

  for (let offset = 34; offset >= 0; offset--) {
    const day = new Date(now);
    day.setDate(day.getDate() - offset);
    const dateKey = toDateKey(day);

    // Water logs (3-5 entries per day; leave today partially filled so user can still add)
    const entryCount = offset === 0 ? 3 : 4 + (offset % 2);
    const amounts = [250, 500, 350, 500, 450, 250];
    for (let i = 0; i < entryCount; i++) {
      const ts = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 8 + i * 3, 15).getTime();
      waterLogs.push({
        id: createId('water'),
        amountMl: amounts[(offset + i) % amounts.length],
        timestamp: ts,
        dateKey,
      });
    }

    // Sleep logs (past 34 days + today morning)
    const bedHour = 22 + (offset % 2);
    const bedMin = [15, 30, 45, 0][offset % 4];
    const wakeHour = 6 + (offset % 3 === 0 ? 1 : 0);
    const wakeMin = [20, 45, 10, 35][offset % 4];
    const bedtime = `${String(bedHour).padStart(2, '0')}:${String(bedMin).padStart(2, '0')}`;
    const wakeTime = `${String(wakeHour).padStart(2, '0')}:${String(wakeMin).padStart(2, '0')}`;
    const durationMinutes = calculateSleepMinutes(bedtime, wakeTime);
    const quality = ([4, 5, 3, 4, 4, 5, 3][offset % 7]) as 1 | 2 | 3 | 4 | 5;

    sleepLogs.push({
      id: createId('sleep'),
      dateKey,
      bedtime,
      wakeTime,
      durationMinutes,
      quality,
      createdAt: new Date(day.getFullYear(), day.getMonth(), day.getDate(), wakeHour, wakeMin).getTime(),
    });

    // Blood pressure every 2 days
    if (offset % 2 === 0) {
      const sys = 114 + ((offset * 3) % 14);
      const dia = 73 + ((offset * 2) % 9);
      const pulse = 62 + (offset % 10);
      bpLogs.push({
        id: createId('bp'),
        systolic: sys,
        diastolic: dia,
        pulse,
        timestamp: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 8, 30).getTime(),
        dateKey,
        note: offset === 0 ? 'Morning resting reading' : undefined,
      });
    }

    // Fasting sessions (skip today so user can test starting live timer, keep 10-day streak up to yesterday)
    if (offset >= 1 && (offset <= 12 || offset % 2 === 0)) {
      const endTs = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12, 5).getTime();
      const targetHours = 16;
      const actualHours = offset % 5 === 0 ? 15.2 : 16.3;
      const startTs = endTs - Math.round(actualHours * 3600000);
      fastingLogs.push({
        id: createId('fast'),
        startTime: startTs,
        endTime: endTs,
        targetHours,
        presetLabel: '16:8',
        completedTarget: actualHours >= targetHours,
        dateKey,
      });
    }

    // Habit completions for streak
    if (offset > 0) {
      demoHabits.forEach((h, idx) => {
        if ((offset + idx) % 4 !== 0 || offset <= 10) {
          const periodKey = h.frequency === 'daily' ? dateKey : toWeekKey(day);
          habitCompletions.push({
            habitId: h.id,
            periodKey,
            completedAt: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 19, 0).getTime(),
          });
        }
      });
    }
  }

  return {
    ...current,
    waterLogs,
    sleepLogs,
    bpLogs,
    fastingLogs,
    habits: demoHabits,
    habitCompletions,
    goals: {
      ...current.goals,
      weightKg: current.goals.weightKg ?? 72,
    },
    settings: {
      ...current.settings,
      onboardingCompleted: true,
      demoDataLoaded: true,
    },
  };
}
