import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: "blue" | "green" | "amber" | "rose" | "purple";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  trend,
  accentColor = "blue"
}) => {
  const getIconWrapperColor = () => {
    switch (accentColor) {
      case "green":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "amber":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "rose":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "purple":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      default:
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    }
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{value}</h3>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className={trend.isPositive ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                {trend.value}
              </span>
              <span className="text-slate-500">vs historical baseline</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${getIconWrapperColor()}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

