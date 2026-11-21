import type {EntitlementState, PlanId} from '../types/health';

export interface OfferingPackage {
  id: PlanId;
  title: string;
  priceLabel: string;
  periodLabel: string;
  badge?: string;
  description: string;
  trialDays?: number;
}

const ENTITLEMENT_STORAGE_KEY = 'vitaltrack_entitlement_v1';

const DEFAULT_ENTITLEMENT: EntitlementState = {
  isPro: false,
  activePlan: null,
  trialActive: false,
  expiresAt: null,
  purchasedAt: null,
};

/**
 * PurchaseService abstracts subscription and entitlement logic.
 * Currently backed by local mock billing state for web/PWA testing.
 * Ready to be swapped with Google Play Billing (Digital Goods API / Capacitor)
 * or RevenueCat Web/Native SDK without modifying UI components.
 */
class PurchaseServiceImpl {
  private listeners = new Set<(state: EntitlementState) => void>();

  getOfferings(): OfferingPackage[] {
    return [
      {
        id: 'monthly',
        title: 'Monthly',
        priceLabel: '$4.99',
        periodLabel: 'per month',
        description: 'Flexible month-to-month access. Cancel anytime.',
        trialDays: 7,
      },
      {
        id: 'yearly',
        title: 'Yearly',
        priceLabel: '$29.99',
        periodLabel: 'per year ($2.50/mo)',
        badge: 'Best value · Save 50%',
        description: 'Includes a 7-day free trial before first charge.',
        trialDays: 7,
      },
      {
        id: 'lifetime',
        title: 'Lifetime',
        priceLabel: '$69.99',
        periodLabel: 'one-time payment',
        description: 'Pay once and own VitalTrack Pro forever across updates.',
      },
    ];
  }

  getEntitlementStatus(): EntitlementState {
    try {
      const raw = localStorage.getItem(ENTITLEMENT_STORAGE_KEY);
      if (!raw) return DEFAULT_ENTITLEMENT;
      const parsed = JSON.parse(raw) as EntitlementState;
      if (parsed.expiresAt && parsed.expiresAt < Date.now() && parsed.activePlan !== 'lifetime') {
        return DEFAULT_ENTITLEMENT;
      }
      return parsed;
    } catch {
      return DEFAULT_ENTITLEMENT;
    }
  }

  subscribe(listener: (state: EntitlementState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private persist(state: EntitlementState): void {
    try {
      localStorage.setItem(ENTITLEMENT_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
    this.listeners.forEach((fn) => fn(state));
  }

  async purchasePackage(planId: PlanId): Promise<{success: boolean; entitlement: EntitlementState; message: string}> {
    // Simulate async store sheet latency for realistic UI feedback
    await new Promise((resolve) => setTimeout(resolve, 450));

    const now = Date.now();
    let expiresAt: number | null = null;
    if (planId === 'monthly') {
      expiresAt = now + 30 * 86400000;
    } else if (planId === 'yearly') {
      expiresAt = now + 365 * 86400000;
    }

    const next: EntitlementState = {
      isPro: true,
      activePlan: planId,
      trialActive: planId !== 'lifetime',
      expiresAt,
      purchasedAt: now,
    };

    this.persist(next);
    return {
      success: true,
      entitlement: next,
      message:
        planId === 'lifetime'
          ? 'VitalTrack Pro Lifetime unlocked.'
          : '7-day free trial started. VitalTrack Pro is active.',
    };
  }

  async restorePurchases(): Promise<{restored: boolean; entitlement: EntitlementState; message: string}> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const current = this.getEntitlementStatus();
    if (current.isPro) {
      this.listeners.forEach((fn) => fn(current));
      return {
        restored: true,
        entitlement: current,
        message: 'Previous VitalTrack Pro purchase restored.',
      };
    }
    return {
      restored: false,
      entitlement: current,
      message: 'No active subscription found on this device.',
    };
  }

  resetEntitlement(): EntitlementState {
    this.persist(DEFAULT_ENTITLEMENT);
    return DEFAULT_ENTITLEMENT;
  }
}

export const PurchaseService = new PurchaseServiceImpl();
