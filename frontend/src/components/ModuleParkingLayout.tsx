import React, { useState, useEffect } from 'react';
import {
  Grid3X3,
  MapPin,
  Car,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Zap,
  Info,
  Clock,
  User,
  Shield,
  Layers,
  ArrowRight,
  Filter,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { LocationItem, SlotItem } from '../types';
import { fetchLocationSlots, triggerSimulationTick, resetSimulation } from '../services/api';
import { StatusBadge } from './StatusBadge';

interface ModuleParkingLayoutProps {
  locations: LocationItem[];
  selectedLocationId?: string;
  onOpenReservationModal?: (slot: SlotItem) => void;
}

export const ModuleParkingLayout: React.FC<ModuleParkingLayoutProps> = ({
  locations,
  selectedLocationId = 'LOC001',
  onOpenReservationModal
}) => {
  const [activeLocationId, setActiveLocationId] = useState<string>(selectedLocationId);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string>('All');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [autoSimulate, setAutoSimulate] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadSlots = async (locId: string) => {
    try {
      setLoading(true);
      const data = await fetchLocationSlots(locId);
      setSlots(data);
      if (selectedSlot) {
        // Refresh selected slot
        const updated = data.find((s) => s.id === selectedSlot.id);
        if (updated) setSelectedSlot(updated);
      }
    } catch (err: any) {
      console.error('Failed to load slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots(activeLocationId);
  }, [activeLocationId]);

  // Auto simulation ticker
  useEffect(() => {
    let interval: any = null;
    if (autoSimulate) {
      interval = setInterval(async () => {
        try {
          await triggerSimulationTick(activeLocationId, 2);
          const updated = await fetchLocationSlots(activeLocationId);
          setSlots(updated);
        } catch (e) {
          console.error(e);
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoSimulate, activeLocationId]);

  const handleManualTick = async () => {
    try {
      const res = await triggerSimulationTick(activeLocationId, 2);
      setStatusMessage(res.message);
      await loadSlots(activeLocationId);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    try {
      const res = await resetSimulation(activeLocationId);
      setStatusMessage(res.message);
      await loadSlots(activeLocationId);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const currentLocation = locations.find((l) => l.location_id === activeLocationId) || locations[0];

  // Filter slots
  const filteredSlots = slots.filter((slot) => {
    if (selectedFloor !== 'All' && !slot.floor.includes(selectedFloor)) return false;
    if (selectedZone !== 'All' && slot.zone !== selectedZone) return false;
    return true;
  });

  const availableCount = slots.filter((s) => s.status === 'Available').length;
  const occupiedCount = slots.filter((s) => s.status === 'Occupied').length;
  const reservedCount = slots.filter((s) => s.status === 'Reserved').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Grid3X3 className="w-3.5 h-3.5" />
          Module 3: Visual Slot Grid & Simulation
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Interactive Parking Layout
        </h1>
        <p className="mt-1 text-slate-300 text-sm max-w-3xl leading-relaxed">
          Interactive floor plan and real-time bay state tracking. Click any slot to view detailed telemetry, occupant metadata, or simulate an immediate advance reservation.
        </p>
      </div>

      {/* Mandatory Simulation Warning Notice (Rule: clearly label simulation data, do not claim camera-based live detection) */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Simulation Notice
              </span>
              <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-medium">
                Synthetic Sensor Emulation
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Parking bay statuses are generated by SmartPark AI's dynamic event simulator. This project does not utilize optical camera detection or physical hardware sensors.
            </p>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAutoSimulate(!autoSimulate)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              autoSimulate
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${autoSimulate ? 'text-white animate-pulse' : 'text-slate-400'}`} />
            <span>{autoSimulate ? 'Auto-Tick Active (5s)' : 'Start Auto-Tick'}</span>
          </button>

          <button
            onClick={handleManualTick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-blue-400" />
            <span>Trigger Vehicle Tick</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Top Filter Bar: Location Selector, Floor, Zone, and Legend */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Location Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Facility:</span>
          </div>
          <select
            value={activeLocationId}
            onChange={(e) => setActiveLocationId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-white focus:outline-none focus:border-blue-500"
          >
            {locations.map((loc) => (
              <option key={loc.location_id} value={loc.location_id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Floor & Zone Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Floor:</span>
            {['All', 'Ground', 'Upper'].map((floor) => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedFloor === floor
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {floor}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Zone:</span>
            {['All', 'Zone A', 'Zone B', 'Zone C', 'Zone D'].map((zone) => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedZone === zone
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>

        {/* Color Legend (Module 3 rules: Green=Available, Red=Occupied, Yellow=Reserved) */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-slate-300">Available ({availableCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span className="text-slate-300">Occupied ({occupiedCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-slate-300">Reserved ({reservedCount})</span>
          </div>
        </div>
      </div>

      {/* Main Layout Grid & Slot Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Interactive Matrix (Col 8) */}
        <div className="lg:col-span-8">
          <div className="glass-panel rounded-3xl p-6 sm:p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  {currentLocation.name} - Slot Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {filteredSlots.length} bays. Click any parking bay to inspect live telemetry.
                </p>
              </div>
              <button
                onClick={() => loadSlots(activeLocationId)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Refresh Slots"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="py-24 text-center">
                <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading bay geometry...</p>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                No parking slots match the selected floor/zone criteria.
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {filteredSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  
                  // Color coding required: Green = Available, Red = Occupied, Yellow = Reserved
                  let bgClasses = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30';
                  let glowBadge = 'bg-emerald-400';
                  
                  if (slot.status === 'Occupied') {
                    bgClasses = 'bg-rose-500/15 border-rose-500/50 text-rose-400 hover:bg-rose-500/30';
                    glowBadge = 'bg-rose-400';
                  } else if (slot.status === 'Reserved') {
                    bgClasses = 'bg-amber-500/15 border-amber-500/50 text-amber-400 hover:bg-amber-500/30';
                    glowBadge = 'bg-amber-400';
                  }

                  if (isSelected) {
                    bgClasses += ' ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105';
                  }

                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`relative p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${bgClasses}`}
                    >
                      <span className={`w-2 h-2 rounded-full absolute top-2 right-2 ${glowBadge}`} />
                      <Car className="w-5 h-5 mb-1" />
                      <span className="text-xs font-black tracking-tight font-mono">{slot.slot_number}</span>
                      <span className="text-[9px] text-slate-300 mt-0.5 truncate w-full text-center">
                        {slot.slot_type === 'EV Charging' ? '⚡ EV' : slot.slot_type === 'Accessible' ? '♿ Acc' : slot.slot_type === 'VIP' ? '★ VIP' : 'Std'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Garage Driving Lane Indicator */}
            <div className="mt-8 border-t-2 border-dashed border-slate-700/60 pt-3 flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-widest px-2">
              <span>◄ EXIT RAMP</span>
              <span>TWO-WAY CENTRAL DRIVING CORRIDOR</span>
              <span>ENTRY GATE ►</span>
            </div>
          </div>
        </div>

        {/* Slot Detail Inspection Panel (Col 4) */}
        <div className="lg:col-span-4">
          <div className="glass-panel rounded-3xl p-6 sm:p-7 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <h3 className="text-base font-bold text-white">Bay Telemetry Details</h3>
                </div>
                {selectedSlot && <StatusBadge status={selectedSlot.status} size="sm" />}
              </div>

              {!selectedSlot ? (
                <div className="py-16 text-center text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
                    <Car className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">No Bay Selected</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                    Click any slot on the map to view real-time occupancy status and customer metadata.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {/* Slot identifier card */}
                  <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Slot Identifier</span>
                        <h4 className="text-2xl font-black text-white font-mono">{selectedSlot.slot_number}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Classification</span>
                        <p className="text-xs font-bold text-blue-400">{selectedSlot.slot_type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Attributes list */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                      <span className="text-slate-400">Facility</span>
                      <span className="text-white font-medium">{currentLocation.name}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                      <span className="text-slate-400">Floor Level</span>
                      <span className="text-white font-medium">{selectedSlot.floor}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                      <span className="text-slate-400">Zone</span>
                      <span className="text-white font-medium">{selectedSlot.zone}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                      <span className="text-slate-400">Current Status</span>
                      <span className="font-bold text-white">{selectedSlot.status}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                      <span className="text-slate-400">Last Sensor Transition</span>
                      <span className="text-slate-300 font-mono text-[11px]">
                        {new Date(selectedSlot.last_status_change).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Active Reservation Details (if Reserved) */}
                  {selectedSlot.current_reservation && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                        <User className="w-3.5 h-3.5" />
                        <span>Active Reservation</span>
                      </div>
                      <div className="text-xs space-y-1 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Customer:</span>
                          <span className="font-semibold text-white">{selectedSlot.current_reservation.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Vehicle:</span>
                          <span className="font-mono text-amber-300 font-bold">{selectedSlot.current_reservation.vehicle_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Code:</span>
                          <span className="font-mono text-xs">{selectedSlot.current_reservation.reservation_code}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Action Button */}
            {selectedSlot && (
              <div className="pt-6">
                {selectedSlot.status === 'Available' ? (
                  <button
                    onClick={() => {
                      if (onOpenReservationModal) onOpenReservationModal(selectedSlot);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Simulate Reservation for {selectedSlot.slot_number}</span>
                  </button>
                ) : (
                  <div className="p-3 bg-slate-900 rounded-xl text-center text-xs text-slate-400 border border-slate-800">
                    Slot is currently {selectedSlot.status.toLowerCase()}. New reservations unavailable.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
