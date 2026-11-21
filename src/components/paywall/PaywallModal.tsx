import {Check, Crown, Loader2, ShieldCheck, X} from 'lucide-react';
import React, {useState} from 'react';
import {useVitalTrack} from '../../context/VitalTrackContext';
import {PurchaseService} from '../../services/PurchaseService';
import type {PlanId} from '../../types/health';

const COMPARISON_ROWS = [
  {feature: 'Water & Fasting trackers', free: 'Included', pro: 'Included'},
  {feature: 'Sleep & Blood Pressure logs', free: '7-day history', pro: 'Unlimited history'},
  {feature: 'Custom habits', free: 'Up to 3 habits', pro: 'Unlimited habits'},
  {feature: 'Insights charts', free: '7 days', pro: '30 & 90 days'},
  {feature: 'Data export', free: '7-day CSV', pro: 'Full CSV & PDF Report'},
  {feature: 'Widget-style reminders & themes', free: 'Standard', pro: 'Custom themes & schedules'},
];

export const PaywallModal: React.FC = () => {
  const {paywallOpen, paywallFeatureLabel, closePaywall, purchasePro, restorePro} =
    useVitalTrack();
  const offerings = PurchaseService.getOfferings();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [loading, setLoading] = useState(false);

  if (!paywallOpen) return null;

  const activeOffering = offerings.find((o) => o.id === selectedPlan) ?? offerings[1];

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await purchasePro(selectedPlan);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      await restorePro();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to VitalTrack Pro"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
    >
      <div className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
              <Crown className="h-4 w-4" />
              <span>7-Day Free Trial · Cancel Anytime</span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              VitalTrack Pro
            </h2>
            {paywallFeatureLabel && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Unlock <strong className="text-slate-700 dark:text-slate-200">{paywallFeatureLabel}</strong> and every Pro wellness tool.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={closePaywall}
            aria-label="Close paywall"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Plan Selector */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {offerings.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 ring-1 ring-teal-600'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {plan.badge && (
                  <span className="mb-2 inline-block rounded-lg bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {plan.badge}
                  </span>
                )}
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {plan.title}
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {plan.priceLabel}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {plan.periodLabel}
                </p>
              </button>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-800/70 px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="col-span-6">Feature</span>
            <span className="col-span-3 text-center">Free</span>
            <span className="col-span-3 text-center text-teal-700 dark:text-teal-300">Pro</span>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {COMPARISON_ROWS.map((row) => (
              <li
                key={row.feature}
                className="grid grid-cols-12 items-center px-4 py-2.5 text-xs"
              >
                <span className="col-span-6 font-medium text-slate-800 dark:text-slate-200">
                  {row.feature}
                </span>
                <span className="col-span-3 text-center text-slate-500 dark:text-slate-400">
                  {row.free}
                </span>
                <span className="col-span-3 flex items-center justify-center gap-1 font-semibold text-teal-700 dark:text-teal-300 text-center">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>{row.pro}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA & Restore */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            disabled={loading}
            onClick={handlePurchase}
            className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-white text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-60 transition active:scale-[0.99]"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>
              {activeOffering.trialDays
                ? `Start ${activeOffering.trialDays}-Day Free Trial (${activeOffering.priceLabel})`
                : `Unlock Lifetime (${activeOffering.priceLabel})`}
            </span>
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              disabled={loading}
              onClick={handleRestore}
              className="min-h-[40px] font-medium text-slate-700 dark:text-slate-300 underline underline-offset-2 hover:text-slate-900 dark:hover:text-white"
            >
              Restore purchase
            </button>
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Local demo billing via PurchaseService</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
