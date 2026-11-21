import {Droplets, HeartPulse, Moon, Timer} from 'lucide-react';
import React from 'react';
import {useVitalTrack} from '../../context/VitalTrackContext';
import type {TrackerType} from '../../types/health';
import {BloodPressureTracker} from './BloodPressureTracker';
import {FastingTracker} from './FastingTracker';
import {SleepTracker} from './SleepTracker';
import {WaterTracker} from './WaterTracker';

const TRACKER_TABS: {
  id: TrackerType;
  label: string;
  icon: React.ComponentType<{className?: string}>;
  activeClass: string;
}[] = [
  {
    id: 'water',
    label: 'Water',
    icon: Droplets,
    activeClass: 'bg-sky-600 text-white shadow-sm',
  },
  {
    id: 'sleep',
    label: 'Sleep',
    icon: Moon,
    activeClass: 'bg-indigo-600 text-white shadow-sm',
  },
  {
    id: 'bp',
    label: 'Blood Pressure',
    icon: HeartPulse,
    activeClass: 'bg-rose-600 text-white shadow-sm',
  },
  {
    id: 'fasting',
    label: 'Fasting',
    icon: Timer,
    activeClass: 'bg-emerald-600 text-white shadow-sm',
  },
];

export const TrackView: React.FC = () => {
  const {activeTracker, setActiveTracker} = useVitalTrack();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Track Vitals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select a tracker to log entries and view recent trends
          </p>
        </div>

        {/* Segmented Tracker Selector */}
        <div
          role="tablist"
          aria-label="Health trackers"
          className="grid grid-cols-4 gap-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1"
        >
          {TRACKER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTracker === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActiveTracker(tab.id)}
                className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition whitespace-nowrap ${
                  isActive
                    ? tab.activeClass
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTracker === 'water' && <WaterTracker />}
      {activeTracker === 'sleep' && <SleepTracker />}
      {activeTracker === 'bp' && <BloodPressureTracker />}
      {activeTracker === 'fasting' && <FastingTracker />}
    </div>
  );
};
