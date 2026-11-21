import {WifiOff} from 'lucide-react';
import React from 'react';
import {useOnlineStatus} from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-md"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span className="whitespace-nowrap">Offline mode · Local data active</span>
    </div>
  );
};
