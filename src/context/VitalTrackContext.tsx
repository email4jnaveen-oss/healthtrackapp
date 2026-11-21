import confetti from 'canvas-confetti';
import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {NotificationService} from '../services/NotificationService';
import {PurchaseService} from '../services/PurchaseService';
import {StorageRepository, buildDemoData} from '../services/storage';
import type {
  AccentTheme,
  ActiveFast,
  AppDataState,
  BloodPressureEntry,
  EntitlementState,
  FastingEntry,
  Habit,
  HabitFrequency,
  NavTab,
  PlanId,
  SleepEntry,
  ThemeMode,
  TrackerType,
  UserGoals,
  UserSettings,
  WaterEntry,
} from '../types/health';
import {createId, toDateKey, toWeekKey} from '../utils/healthUtils';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone?: 'neutral' | 'success' | 'warning';
}

interface VitalTrackContextValue {
  state: AppDataState;
  entitlement: EntitlementState;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  activeTracker: TrackerType;
  setActiveTracker: (tracker: TrackerType) => void;
  openTracker: (tracker: TrackerType) => void;
  paywallOpen: boolean;
  paywallFeatureLabel: string | null;
  openPaywall: (featureLabel?: string) => void;
  closePaywall: () => void;
  toast: ToastMessage | null;
  showToast: (title: string, description?: string, tone?: ToastMessage['tone']) => void;
  dismissToast: () => void;
  // Water actions
  addWater: (amountMl: number) => void;
  undoLastWater: () => void;
  deleteWaterEntry: (id: string) => void;
  // Sleep actions
  addSleepEntry: (entry: Omit<SleepEntry, 'id' | 'createdAt'>) => void;
  deleteSleepEntry: (id: string) => void;
  // Blood Pressure actions
  addBPEntry: (entry: Omit<BloodPressureEntry, 'id'>) => void;
  deleteBPEntry: (id: string) => void;
  // Fasting actions
  startFast: (targetHours: number, presetLabel: string, customStartTime?: number) => void;
  stopFast: (saveToHistory?: boolean) => void;
  deleteFastingEntry: (id: string) => void;
  // Habit actions
  addHabit: (name: string, icon: string, frequency: HabitFrequency) => boolean;
  toggleHabitCompletion: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;
  // Goals & Settings actions
  updateGoals: (patch: Partial<UserGoals>) => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
  updateReminders: (patch: Partial<UserSettings['reminders']>) => void;
  completeOnboarding: (goalsPatch?: Partial<UserGoals>, volumeUnit?: UserSettings['volumeUnit']) => void;
  toggleDemoData: () => void;
  deleteAllData: () => void;
  // Purchases
  purchasePro: (planId: PlanId) => Promise<void>;
  restorePro: () => Promise<void>;
  resetProMock: () => void;
}

const VitalTrackContext = createContext<VitalTrackContextValue | null>(null);

function triggerGoalConfetti() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    confetti({
      particleCount: 55,
      spread: 64,
      origin: {y: 0.72},
      disableForReducedMotion: true,
    });
  } catch {
    // Ignore confetti failures
  }
}

export const VitalTrackProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [state, setState] = useState<AppDataState>(() => StorageRepository.loadState());
  const [entitlement, setEntitlement] = useState<EntitlementState>(() =>
    PurchaseService.getEntitlementStatus()
  );
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [activeTracker, setActiveTracker] = useState<TrackerType>('water');
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallFeatureLabel, setPaywallFeatureLabel] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback(
    (title: string, description?: string, tone: ToastMessage['tone'] = 'neutral') => {
      const id = createId('toast');
      setToast({id, title, description, tone});
    },
    []
  );

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(timer);
  }, [toast]);

  // Persist app state on change
  useEffect(() => {
    StorageRepository.saveState(state);
  }, [state]);

  // Subscribe to PurchaseService changes
  useEffect(() => {
    return PurchaseService.subscribe((next) => setEntitlement(next));
  }, []);

  // Apply light/dark theme + accent theme
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (mode: ThemeMode) => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
      root.classList.toggle('dark', isDark);
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', isDark ? '#0B0F17' : '#F7F8FA');
      }
    };

    applyTheme(state.settings.theme);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (state.settings.theme === 'system') {
        applyTheme('system');
      }
    };
    media.addEventListener('change', listener);

    const effectiveAccent: AccentTheme = entitlement.isPro ? state.settings.accentTheme : 'calm';
    root.setAttribute('data-accent-theme', effectiveAccent);

    return () => media.removeEventListener('change', listener);
  }, [state.settings.theme, state.settings.accentTheme, entitlement.isPro]);

  // Periodic reminder evaluation (every 30s while open)
  useEffect(() => {
    const check = () => {
      NotificationService.evaluateReminders(
        state.settings.reminders,
        state.activeFast,
        (title, body) => showToast(title, body, 'neutral')
      );
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [state.settings.reminders, state.activeFast, showToast]);

  const openTracker = useCallback((tracker: TrackerType) => {
    setActiveTracker(tracker);
    setActiveTab('track');
  }, []);

  const openPaywall = useCallback((featureLabel?: string) => {
    setPaywallFeatureLabel(featureLabel ?? null);
    setPaywallOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    setPaywallOpen(false);
    setPaywallFeatureLabel(null);
  }, []);

  // Water actions
  const addWater = useCallback(
    (amountMl: number) => {
      if (amountMl <= 0) return;
      const now = Date.now();
      const todayKey = toDateKey(now);
      const entry: WaterEntry = {
        id: createId('water'),
        amountMl,
        timestamp: now,
        dateKey: todayKey,
      };
      setState((prev) => {
        const prevTodayTotal = prev.waterLogs
          .filter((w) => w.dateKey === todayKey)
          .reduce((acc, w) => acc + w.amountMl, 0);
        const nextTotal = prevTodayTotal + amountMl;
        let lastCelebrated = prev.lastCelebratedWaterDate;

        if (
          prevTodayTotal < prev.goals.waterDailyMl &&
          nextTotal >= prev.goals.waterDailyMl &&
          lastCelebrated !== todayKey
        ) {
          lastCelebrated = todayKey;
          setTimeout(() => {
            triggerGoalConfetti();
            showToast('Daily hydration goal reached', 'Great consistency today.', 'success');
          }, 80);
        }

        return {
          ...prev,
          waterLogs: [entry, ...prev.waterLogs],
          lastCelebratedWaterDate: lastCelebrated,
        };
      });
    },
    [showToast]
  );

  const undoLastWater = useCallback(() => {
    const todayKey = toDateKey();
    setState((prev) => {
      const idx = prev.waterLogs.findIndex((w) => w.dateKey === todayKey);
      if (idx === -1) return prev;
      const updated = [...prev.waterLogs];
      updated.splice(idx, 1);
      return {...prev, waterLogs: updated};
    });
    showToast('Last water entry removed');
  }, [showToast]);

  const deleteWaterEntry = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      waterLogs: prev.waterLogs.filter((w) => w.id !== id),
    }));
  }, []);

  // Sleep actions
  const addSleepEntry = useCallback(
    (entry: Omit<SleepEntry, 'id' | 'createdAt'>) => {
      const newEntry: SleepEntry = {
        ...entry,
        id: createId('sleep'),
        createdAt: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        sleepLogs: [newEntry, ...prev.sleepLogs].sort((a, b) =>
          b.dateKey.localeCompare(a.dateKey)
        ),
      }));
      showToast('Sleep entry saved', undefined, 'success');
    },
    [showToast]
  );

  const deleteSleepEntry = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      sleepLogs: prev.sleepLogs.filter((s) => s.id !== id),
    }));
  }, []);

  // BP actions
  const addBPEntry = useCallback(
    (entry: Omit<BloodPressureEntry, 'id'>) => {
      const newEntry: BloodPressureEntry = {
        ...entry,
        id: createId('bp'),
      };
      setState((prev) => ({
        ...prev,
        bpLogs: [newEntry, ...prev.bpLogs].sort((a, b) => b.timestamp - a.timestamp),
      }));
      showToast('Blood pressure reading logged', undefined, 'success');
    },
    [showToast]
  );

  const deleteBPEntry = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      bpLogs: prev.bpLogs.filter((b) => b.id !== id),
    }));
  }, []);

  // Fasting actions
  const startFast = useCallback(
    (targetHours: number, presetLabel: string, customStartTime?: number) => {
      const startTime = customStartTime ?? Date.now();
      const fast: ActiveFast = {
        id: createId('fast'),
        startTime,
        targetHours,
        presetLabel,
      };
      setState((prev) => ({...prev, activeFast: fast}));
      showToast(`${presetLabel} fast started`, `Target: ${targetHours} hours`, 'success');
    },
    [showToast]
  );

  const stopFast = useCallback(
    (saveToHistory = true) => {
      setState((prev) => {
        if (!prev.activeFast) return prev;
        const endTime = Date.now();
        const elapsedHours = (endTime - prev.activeFast.startTime) / 3600000;
        const completedTarget = elapsedHours >= prev.activeFast.targetHours;

        if (!saveToHistory || elapsedHours < 0.01) {
          return {...prev, activeFast: null};
        }

        const completedEntry: FastingEntry = {
          id: prev.activeFast.id,
          startTime: prev.activeFast.startTime,
          endTime,
          targetHours: prev.activeFast.targetHours,
          presetLabel: prev.activeFast.presetLabel,
          completedTarget,
          dateKey: toDateKey(endTime),
        };

        if (completedTarget) {
          setTimeout(() => {
            triggerGoalConfetti();
            showToast('Fast completed!', `${prev.activeFast?.presetLabel} target achieved.`, 'success');
          }, 80);
        } else {
          setTimeout(() => {
            showToast('Fast ended and saved to history');
          }, 80);
        }

        return {
          ...prev,
          activeFast: null,
          fastingLogs: [completedEntry, ...prev.fastingLogs],
        };
      });
    },
    [showToast]
  );

  const deleteFastingEntry = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      fastingLogs: prev.fastingLogs.filter((f) => f.id !== id),
    }));
  }, []);

  // Habits
  const addHabit = useCallback(
    (name: string, icon: string, frequency: HabitFrequency): boolean => {
      if (!entitlement.isPro && state.habits.length >= 3) {
        openPaywall('Unlimited Custom Habits');
        return false;
      }
      const newHabit: Habit = {
        id: createId('habit'),
        name: name.trim(),
        icon,
        frequency,
        createdAt: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        habits: [...prev.habits, newHabit],
      }));
      showToast('Habit added', name.trim(), 'success');
      return true;
    },
    [entitlement.isPro, state.habits.length, openPaywall, showToast]
  );

  const toggleHabitCompletion = useCallback((habitId: string) => {
    setState((prev) => {
      const habit = prev.habits.find((h) => h.id === habitId);
      if (!habit) return prev;
      const periodKey = habit.frequency === 'daily' ? toDateKey() : toWeekKey();
      const exists = prev.habitCompletions.some(
        (c) => c.habitId === habitId && c.periodKey === periodKey
      );
      if (exists) {
        return {
          ...prev,
          habitCompletions: prev.habitCompletions.filter(
            (c) => !(c.habitId === habitId && c.periodKey === periodKey)
          ),
        };
      }
      return {
        ...prev,
        habitCompletions: [
          ...prev.habitCompletions,
          {habitId, periodKey, completedAt: Date.now()},
        ],
      };
    });
  }, []);

  const deleteHabit = useCallback((habitId: string) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== habitId),
      habitCompletions: prev.habitCompletions.filter((c) => c.habitId !== habitId),
    }));
  }, []);

  // Settings & Goals
  const updateGoals = useCallback((patch: Partial<UserGoals>) => {
    setState((prev) => ({
      ...prev,
      goals: {...prev.goals, ...patch},
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: {...prev.settings, ...patch},
    }));
  }, []);

  const updateReminders = useCallback((patch: Partial<UserSettings['reminders']>) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        reminders: {...prev.settings.reminders, ...patch},
      },
    }));
  }, []);

  const completeOnboarding = useCallback(
    (goalsPatch?: Partial<UserGoals>, volumeUnit?: UserSettings['volumeUnit']) => {
      setState((prev) => ({
        ...prev,
        goals: {...prev.goals, ...(goalsPatch ?? {})},
        settings: {
          ...prev.settings,
          volumeUnit: volumeUnit ?? prev.settings.volumeUnit,
          onboardingCompleted: true,
        },
      }));
    },
    []
  );

  const toggleDemoData = useCallback(() => {
    setState((prev) => {
      if (prev.settings.demoDataLoaded) {
        const fresh = StorageRepository.clearAll();
        return {
          ...fresh,
          settings: {
            ...prev.settings,
            demoDataLoaded: false,
            onboardingCompleted: true,
          },
        };
      }
      return buildDemoData(prev);
    });
    showToast(
      state.settings.demoDataLoaded ? 'Demo data cleared' : 'Demo data loaded',
      state.settings.demoDataLoaded
        ? 'Your tracker history is now empty.'
        : '35 days of sample health data added for preview.',
      'success'
    );
  }, [state.settings.demoDataLoaded, showToast]);

  const deleteAllData = useCallback(() => {
    const fresh = StorageRepository.clearAll();
    setState({...fresh, settings: {...fresh.settings, onboardingCompleted: true}});
    showToast('All local data deleted', 'Your device storage has been cleared.', 'warning');
  }, [showToast]);

  // Purchases
  const purchasePro = useCallback(
    async (planId: PlanId) => {
      const res = await PurchaseService.purchasePackage(planId);
      if (res.success) {
        setEntitlement(res.entitlement);
        setPaywallOpen(false);
        triggerGoalConfetti();
        showToast('Welcome to VitalTrack Pro', res.message, 'success');
      }
    },
    [showToast]
  );

  const restorePro = useCallback(async () => {
    const res = await PurchaseService.restorePurchases();
    setEntitlement(res.entitlement);
    if (res.restored) {
      setPaywallOpen(false);
      showToast('Purchase restored', res.message, 'success');
    } else {
      showToast('Restore check complete', res.message, 'neutral');
    }
  }, [showToast]);

  const resetProMock = useCallback(() => {
    const next = PurchaseService.resetEntitlement();
    setEntitlement(next);
    showToast('Switched back to Free tier');
  }, [showToast]);

  return (
    <VitalTrackContext.Provider
      value={{
        state,
        entitlement,
        activeTab,
        setActiveTab,
        activeTracker,
        setActiveTracker,
        openTracker,
        paywallOpen,
        paywallFeatureLabel,
        openPaywall,
        closePaywall,
        toast,
        showToast,
        dismissToast,
        addWater,
        undoLastWater,
        deleteWaterEntry,
        addSleepEntry,
        deleteSleepEntry,
        addBPEntry,
        deleteBPEntry,
        startFast,
        stopFast,
        deleteFastingEntry,
        addHabit,
        toggleHabitCompletion,
        deleteHabit,
        updateGoals,
        updateSettings,
        updateReminders,
        completeOnboarding,
        toggleDemoData,
        deleteAllData,
        purchasePro,
        restorePro,
        resetProMock,
      }}
    >
      {children}
    </VitalTrackContext.Provider>
  );
};

export function useVitalTrack() {
  const ctx = useContext(VitalTrackContext);
  if (!ctx) throw new Error('useVitalTrack must be used within VitalTrackProvider');
  return ctx;
}
