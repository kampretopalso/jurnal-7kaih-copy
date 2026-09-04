import React from 'react';
import { StatusWaktu } from '../../types/database';
import { getStatusWaktuLabel } from '../../lib/timeCalculator';
import { AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react';

interface StatusBadgeProps {
  status: StatusWaktu;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true }) => {
  const { label, badgeColor } = getStatusWaktuLabel(status);

  const getIcon = () => {
    switch (status) {
      case 'tepat_waktu':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />;
      case 'toleransi':
        return <Clock className="w-3.5 h-3.5 text-amber-600 mr-1" />;
      case 'terlambat':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600 mr-1" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 mr-1" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}
    >
      {showIcon && getIcon()}
      {label}
    </span>
  );
};

export const FlagBadge: React.FC<{ reason?: string | null; onClick?: () => void }> = ({
  reason,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      type="button"
      title={reason || 'Foto perlu ditinjau'}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors"
    >
      <AlertTriangle className="w-3 h-3 text-amber-700 animate-pulse" />
      <span>Flag Foto</span>
    </button>
  );
};
