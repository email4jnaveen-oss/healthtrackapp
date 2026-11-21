import {Lock} from 'lucide-react';
import React from 'react';
import {useVitalTrack} from '../../context/VitalTrackContext';

interface ProGateOverlayProps {
  featureName: string;
  description: string;
  children: React.ReactNode;
  locked: boolean;
  minHeightClass?: string;
}

export const ProGateOverlay: React.FC<ProGateOverlayProps> = ({
  featureName,
  description,
  children,
  locked,
  minHeightClass = 'min-h-[180px]',
}) => {
  const {openPaywall} = useVitalTrack();

  if (!locked) {
    return <>{children}</>;
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${minHeightClass}`}>
      <div className="pointer-events-none select-none blur-[5px] opacity-45" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/65 dark:bg-slate-950/65 backdrop-blur-sm p-5 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 mb-3">
          <Lock className="h-5 w-5" />
        </div>
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">{featureName}</h4>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </p>
        <button
          type="button"
          onClick={() => openPaywall(featureName)}
          className="mt-4 min-h-[44px] rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 whitespace-nowrap"
        >
          Upgrade to VitalTrack Pro
        </button>
      </div>
    </div>
  );
};
