export type VolumeUnit = 'ml' | 'oz';
export type WeightUnit = 'kg' | 'lb';
export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentTheme = 'calm' | 'oceanic' | 'forest' | 'midnight';

export type NavTab = 'home' | 'track' | 'insights' | 'settings';
export type TrackerType = 'water' | 'sleep' | 'bp' | 'fasting';

export interface WaterEntry {
  id: string;
  amountMl: number; // stored canonically in ml
  timestamp: number; // epoch ms
  dateKey: string; // YYYY-MM-DD local
}

export interface SleepEntry {
  id: string;
  dateKey: string; // wake date YYYY-MM-DD
  bedtime: string; // HH:mm
  wakeTime: string; // HH:mm
  durationMinutes: number;
  quality: 1 | 2 | 3 | 4 | 5;
  note?: string;
  createdAt: number;
}

export type BPCategory = 'low' | 'normal' | 'elevated' | 'high_1' | 'high_2';

export interface BloodPressureEntry {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  timestamp: number;
  dateKey: string;
  note?: string;
}

export interface ActiveFast {
  id: string;
  startTime: number; // epoch ms
  targetHours: number;
  presetLabel: string;
}

export interface FastingEntry {
  id: string;
  startTime: number;
  endTime: number;
  targetHours: number;
  presetLabel: string;
  completedTarget: boolean;
  dateKey: string; // end date YYYY-MM-DD
}

export type HabitFrequency = 'daily' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  frequency: HabitFrequency;
  createdAt: number;
}

export interface HabitCompletion {
  habitId: string;
  periodKey: string; // YYYY-MM-DD for daily, YYYY-Www for weekly
  completedAt: number;
}

export interface ReminderSettings {
  waterEnabled: boolean;
  waterIntervalHours: number;
  waterStartHour: number;
  waterEndHour: number;
  bedtimeEnabled: boolean;
  bedtimeTime: string; // HH:mm
  fastingStartEnabled: boolean;
  fastingStartTime: string; // HH:mm
  fastingEndEnabled: boolean;
}

export interface UserGoals {
  waterDailyMl: number;
  sleepTargetHours: number;
  defaultFastingPreset: string;
  defaultFastingHours: number;
  weightKg?: number;
}

export interface UserSettings {
  volumeUnit: VolumeUnit;
  weightUnit: WeightUnit;
  theme: ThemeMode;
  accentTheme: AccentTheme;
  onboardingCompleted: boolean;
  demoDataLoaded: boolean;
  reminders: ReminderSettings;
}

export type PlanId = 'monthly' | 'yearly' | 'lifetime';

export interface EntitlementState {
  isPro: boolean;
  activePlan: PlanId | null;
  trialActive: boolean;
  expiresAt: number | null;
  purchasedAt: number | null;
}

export interface AppDataState {
  version: number;
  waterLogs: WaterEntry[];
  sleepLogs: SleepEntry[];
  bpLogs: BloodPressureEntry[];
  activeFast: ActiveFast | null;
  fastingLogs: FastingEntry[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  goals: UserGoals;
  settings: UserSettings;
  lastCelebratedWaterDate?: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progressLabel: string;
}
