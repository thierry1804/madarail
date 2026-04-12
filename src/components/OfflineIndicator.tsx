import { WifiOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface OfflineIndicatorProps {
  className?: string;
  /** Show icon only (no label), for compact spaces like the mobile header */
  compact?: boolean;
}

export function OfflineIndicator({ className = '', compact = false }: OfflineIndicatorProps) {
  const { isOnline } = useApp();
  if (isOnline) return null;
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white ${className}`}
      title="Hors ligne"
    >
      <WifiOff className="w-3.5 h-3.5" />
      {!compact && <span>Hors ligne</span>}
    </div>
  );
}
