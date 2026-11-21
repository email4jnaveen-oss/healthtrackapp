import type {ActiveFast, ReminderSettings} from '../types/health';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

const SENT_LOG_KEY = 'vitaltrack_notified_events_v1';

/**
 * NotificationService abstracts Web Notifications API & Service Worker notifications.
 * Designed with a clean interface so Capacitor LocalNotifications or Android WorkManager
 * can be plugged in when wrapping VitalTrack as a native Android APK/AAB.
 */
class NotificationServiceImpl {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermissionState(): NotificationPermissionState {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission as NotificationPermissionState;
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      return result as NotificationPermissionState;
    } catch {
      return 'denied';
    }
  }

  async sendNotification(title: string, body: string, tag?: string): Promise<boolean> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: tag ?? `vitaltrack-${Date.now()}`,
          });
          return true;
        }
      }

      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        tag: tag ?? `vitaltrack-${Date.now()}`,
      });
      return true;
    } catch {
      return false;
    }
  }

  private getSentMap(): Record<string, number> {
    try {
      const raw = localStorage.getItem(SENT_LOG_KEY);
      return raw ? (JSON.parse(raw) as Record<string, number>) : {};
    } catch {
      return {};
    }
  }

  private markSent(eventKey: string): void {
    try {
      const map = this.getSentMap();
      map[eventKey] = Date.now();
      // Keep only recent 40 keys
      const entries = Object.entries(map).slice(-40);
      localStorage.setItem(SENT_LOG_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {
      // Ignore storage errors
    }
  }

  private wasSentRecently(eventKey: string, cooldownMs: number): boolean {
    const map = this.getSentMap();
    const last = map[eventKey];
    return typeof last === 'number' && Date.now() - last < cooldownMs;
  }

  /**
   * Evaluates active reminder rules while the app is open or running in background tab.
   */
  async evaluateReminders(
    reminders: ReminderSettings,
    activeFast: ActiveFast | null,
    onInAppReminder?: (title: string, body: string) => void
  ): Promise<void> {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    // 1. Fasting goal completed reminder
    if (reminders.fastingEndEnabled && activeFast) {
      const targetEnd = activeFast.startTime + activeFast.targetHours * 3600000;
      if (Date.now() >= targetEnd) {
        const key = `fast_end_${activeFast.id}`;
        if (!this.wasSentRecently(key, 24 * 3600000)) {
          this.markSent(key);
          const title = 'Fasting target reached';
          const body = `You completed your ${activeFast.presetLabel} (${activeFast.targetHours}h) fast.`;
          const sentNative = await this.sendNotification(title, body, key);
          if (!sentNative && onInAppReminder) {
            onInAppReminder(title, body);
          }
        }
      }
    }

    // 2. Bedtime reminder (within 5-minute window)
    if (reminders.bedtimeEnabled) {
      const [bH, bM] = reminders.bedtimeTime.split(':').map(Number);
      if (hour === bH && Math.abs(minute - bM) <= 2) {
        const key = `bedtime_${todayStr}`;
        if (!this.wasSentRecently(key, 12 * 3600000)) {
          this.markSent(key);
          const title = 'Wind down for sleep';
          const body = 'Your scheduled bedtime is approaching. Log tonight’s rest tomorrow morning.';
          const sentNative = await this.sendNotification(title, body, key);
          if (!sentNative && onInAppReminder) {
            onInAppReminder(title, body);
          }
        }
      }
    }

    // 3. Fasting start reminder
    if (reminders.fastingStartEnabled && !activeFast) {
      const [fH, fM] = reminders.fastingStartTime.split(':').map(Number);
      if (hour === fH && Math.abs(minute - fM) <= 2) {
        const key = `fast_start_${todayStr}`;
        if (!this.wasSentRecently(key, 12 * 3600000)) {
          this.markSent(key);
          const title = 'Time to start your fast';
          const body = 'Open VitalTrack to start your fasting timer.';
          const sentNative = await this.sendNotification(title, body, key);
          if (!sentNative && onInAppReminder) {
            onInAppReminder(title, body);
          }
        }
      }
    }

    // 4. Water hydration interval reminder
    if (
      reminders.waterEnabled &&
      hour >= reminders.waterStartHour &&
      hour <= reminders.waterEndHour
    ) {
      const slot = Math.floor(hour / Math.max(1, reminders.waterIntervalHours));
      const key = `water_${todayStr}_${slot}`;
      if (minute < 5 && !this.wasSentRecently(key, reminders.waterIntervalHours * 3500000)) {
        this.markSent(key);
        const title = 'Hydration check-in';
        const body = 'Take a moment to drink a glass of water and log it in VitalTrack.';
        const sentNative = await this.sendNotification(title, body, key);
        if (!sentNative && onInAppReminder) {
          onInAppReminder(title, body);
        }
      }
    }
  }
}

export const NotificationService = new NotificationServiceImpl();
