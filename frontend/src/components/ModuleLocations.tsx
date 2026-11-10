import React, { useState } from 'react';
import {
  Building,
  MapPin,
  Car,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles,
  Grid3X3,
  Compass
} from 'lucide-react';
import { LocationItem } from '../types';
import { StatusBadge } from './StatusBadge';

interface ModuleLocationsProps {
  locations: LocationItem[];
  onSelectLocationForLayout: (locId: string) => void;
  onSelectLocationForPrediction: (locId: string) => void;
}

export const ModuleLocations: React.FC<ModuleLocationsProps> = ({
  locations,
  onSelectLocationForLayout,
  onSelectLocationForPrediction
}) => {
  const [filterType, setFilterType] = useState<string>('All');

  const types = ['All', 'Transit / Commuter', 'Commercial / IT Office', 'Retail & Entertainment', 'Travel & Transportation', 'Academic & Research'];

  const filtered = locations.filter((loc) => {
    if (filterType === 'All') return true;
    return loc.type.includes(filterType) || loc.type === filterType;
  });

  const totalCap = locations.reduce((sum, l) => sum + l.capacity, 0);
  const totalOcc = locations.reduce((sum, l) => sum + l.occupied, 0);
  const totalAvail = locations.reduce((sum, l) => sum + l.available, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <MapPin className="w-3.5 h-3.5" />
          Module 4: Facility Network Management
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Municipal & Commercial Parking Facilities
        </h1>
        <p className="mt-1 text-slate-300 text-sm max-w-3xl leading-relaxed">
          Comprehensive multi-location registry tracking total capacity, live occupancy levels, and dynamic pricing across all municipal and commercial parking garages.
        </p>
      </div>

      {/* Network Rollup Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-blue-500">
          <p className="text-xs text-slate-400 uppercase font-semibold">Total Network Capacity</p>
          <p className="text-2xl font-black text-white mt-1">{totalCap.toLocaleString()} Bays</p>
          <p className="text-xs text-slate-400 mt-1">Across {locations.length} operational garages</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-rose-500">
          <p className="text-xs text-slate-400 uppercase font-semibold">Total Occupied Bays</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{totalOcc.toLocaleString()} Vehicles</p>
          <p className="text-xs text-slate-400 mt-1">{Math.round((totalOcc / totalCap) * 100)}% network saturation</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs text-slate-400 uppercase font-semibold">Total Available Bays</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{totalAvail.toLocaleString()} Vacant</p>
          <p className="text-xs text-slate-400 mt-1">Ready for real-time allocation</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-2">Filter Type:</span>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              filterType === t
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Facility Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((loc) => {
          const occPct = loc.occupancy_percentage;
          return (
            <div
              key={loc.location_id}
              className="glass-panel glass-panel-hover rounded-3xl p-6 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {loc.location_id}
                  </span>
                  <StatusBadge status={loc.demand_level} size="sm" />
                </div>

                <h3 className="text-lg font-bold text-white mt-3">{loc.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{loc.address}</span>
                </p>

                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[11px] font-medium border border-slate-700/60">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>{loc.type}</span>
                </div>

                {/* Progress bar */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">Occupancy Saturation</span>
                    <span className="text-white font-bold">{occPct}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        occPct >= 80 ? 'bg-rose-500' : occPct >= 50 ? 'bg-blue-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, occPct)}%` }}
                    />
                  </div>
                </div>

                {/* Metrics 3-box */}
                <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Capacity</span>
                    <p className="text-base font-bold text-white mt-0.5">{loc.capacity}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Occupied</span>
                    <p className="text-base font-bold text-rose-400 mt-0.5">{loc.occupied}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Available</span>
                    <p className="text-base font-bold text-emerald-400 mt-0.5">{loc.available}</p>
                  </div>
                </div>

                {/* Tariff */}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-300 px-1">
                  <span className="flex items-center gap-1 text-slate-400">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Hourly Parking Tariff:
                  </span>
                  <span className="font-bold text-white">${loc.hourly_rate.toFixed(2)} / hr</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSelectLocationForLayout(loc.location_id)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  <Grid3X3 className="w-3.5 h-3.5 text-blue-400" />
                  <span>View Bays</span>
                </button>
                <button
                  onClick={() => onSelectLocationForPrediction(loc.location_id)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Predict</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

