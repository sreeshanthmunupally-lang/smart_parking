import React from 'react';

interface StatusBadgeProps {
  status: "Available" | "Occupied" | "Reserved" | "Low" | "Medium" | "High" | "Active" | "Cancelled" | string;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const getStyles = () => {
    switch (status) {
      case "Available":
        return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
      case "Occupied":
        return "bg-rose-500/15 text-rose-400 border border-rose-500/30";
      case "Reserved":
        return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
      case "Low":
        return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
      case "Medium":
        return "bg-sky-500/15 text-sky-400 border border-sky-500/30";
      case "High":
        return "bg-rose-500/15 text-rose-400 border border-rose-500/30";
      case "Active":
        return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
      case "Cancelled":
        return "bg-slate-500/15 text-slate-400 border border-slate-500/30";
      default:
        return "bg-slate-700/50 text-slate-300 border border-slate-600/50";
    }
  };

  const getSize = () => {
    switch (size) {
      case "sm":
        return "px-2 py-0.5 text-xs";
      case "lg":
        return "px-3.5 py-1 text-sm font-semibold";
      default:
        return "px-2.5 py-1 text-xs font-medium";
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${getSize()} ${getStyles()} transition-colors`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === "Available" || status === "Low" ? "bg-emerald-400 animate-pulse" :
        status === "Occupied" || status === "High" ? "bg-rose-400" :
        status === "Reserved" ? "bg-amber-400" : "bg-sky-400"
      }`} />
      {status}
    </span>
  );
};
