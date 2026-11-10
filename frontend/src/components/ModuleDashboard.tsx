import React from 'react';
import {
  Car,
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DashboardStats, LocationItem } from '../types';
import { StatCard } from './StatCard';
import { StatusBadge } from './StatusBadge';

interface ModuleDashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigateTab: (tab: string) => void;
  onTriggerTick: () => void;
  onResetSimulation: () => void;
  tickMessage?: string | null;
}

export const ModuleDashboard: React.FC<ModuleDashboardProps> = ({
  stats,
  loading,
  onNavigateTab,
  onTriggerTick,
  onResetSimulation,
  tickMessage
}) => {
  if (loading || !stats) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading SmartPark AI live telemetry...</p>
      </div>
    );
  }

  const chartData = stats.hourly_trends.map((t) => ({
    time: t.hour,
    Occupied: t.occupied,
    Available: t.available,
    Rate: t.occupancy_rate
  }));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome & Quick Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/40 border border-blue-500/20 rounded-3xl p-6 sm:p-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Machine Learning Engine Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Smart Parking Intelligence Overview
          </h1>
          <p className="mt-1 text-slate-300 text-sm max-w-2xl leading-relaxed">
            Continuous occupancy telemetry, multi-location capacity tracking, and regression-based parking availability forecasting.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('predict')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Launch Predictor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards: 4 primary metrics required by Module 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Parking Capacity"
          value={stats.total_capacity.toLocaleString()}
          subtitle="Across 5 urban facilities"
          icon={Layers}
          accentColor="blue"
        />
        <StatCard
          title="Occupied Spaces"
          value={stats.total_occupied.toLocaleString()}
          subtitle={`${stats.overall_occupancy_percentage}% overall occupancy`}
          icon={Car}
          badge={<StatusBadge status={stats.overall_demand_status} size="sm" />}
          accentColor="amber"
          trend={{ value: "+3.2%", isPositive: true }}
        />
        <StatCard
          title="Available Spaces"
          value={stats.total_available.toLocaleString()}
          subtitle="Vacant for immediate parking"
          icon={CheckCircle2}
          accentColor="green"
        />
        <StatCard
          title="Parking Demand Status"
          value={stats.overall_demand_status}
          subtitle={
            stats.overall_demand_status === "High"
              ? "Bottlenecks likely in central zones"
              : stats.overall_demand_status === "Medium"
              ? "Steady turnover across garages"
              : "Ample spaces citywide"
          }
          icon={TrendingUp}
          badge={<StatusBadge status={stats.overall_demand_status} size="sm" />}
          accentColor={
            stats.overall_demand_status === "High"
              ? "rose"
              : stats.overall_demand_status === "Medium"
              ? "blue"
              : "green"
          }
        />
      </div>

      {/* Simulation Banner & Interactive Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Telemetry Simulation Engine
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                Demo Emulation Mode
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulates vehicle arrivals and departures. Clearly labeled simulation data (no physical camera hardware required).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerTick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-blue-400" />
            <span>Simulate Traffic Tick</span>
          </button>
          <button
            onClick={onResetSimulation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {tickMessage && (
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{tickMessage}</span>
        </div>
      )}

      {/* Main Availability Trends Chart */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              24-Hour Parking Availability & Occupancy Trend
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated hourly occupancy count and vacancy patterns across all managed locations.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-slate-300">Occupied Spaces</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-slate-300">Available Spaces</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="occupiedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="availableGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#F8FAFC'
                }}
              />
              <Area
                type="monotone"
                dataKey="Occupied"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#occupiedGrad)"
              />
              <Area
                type="monotone"
                dataKey="Available"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#availableGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Multi-Location Overview Grid (Module 1 + 4 preview) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              Active Parking Facilities
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live capacity, current occupancy, and tariff across all parking locations.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('locations')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Facilities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stats.locations.map((loc) => (
            <div
              key={loc.location_id}
              className="glass-panel glass-panel-hover rounded-2xl p-5 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                    {loc.location_id}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">{loc.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{loc.address}</p>
                </div>
                <StatusBadge status={loc.demand_level} size="sm" />
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Occupancy</span>
                  <span className="text-white font-bold">{loc.occupancy_percentage}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      loc.occupancy_percentage >= 80
                        ? 'bg-rose-500'
                        : loc.occupancy_percentage >= 50
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, loc.occupancy_percentage)}%` }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Capacity</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{loc.capacity}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Occupied</p>
                  <p className="text-sm font-semibold text-rose-400 mt-0.5">{loc.occupied}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Available</p>
                  <p className="text-sm font-semibold text-emerald-400 mt-0.5">{loc.available}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400 font-medium">
                  ${loc.hourly_rate.toFixed(2)}/hr
                </span>
                <button
                  onClick={() => onNavigateTab('layout')}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  <span>Interactive Map</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

