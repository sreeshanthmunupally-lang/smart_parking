import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Car,
  User,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Calendar
} from 'lucide-react';
import { LocationItem, SlotItem, ReservationItem } from '../types';
import {
  fetchReservations,
  createReservation,
  cancelReservation,
  fetchLocationSlots
} from '../services/api';
import { StatusBadge } from './StatusBadge';

interface ModuleReservationsProps {
  locations: LocationItem[];
  preselectedSlot?: SlotItem | null;
  onClearPreselectedSlot?: () => void;
}

export const ModuleReservations: React.FC<ModuleReservationsProps> = ({
  locations,
  preselectedSlot,
  onClearPreselectedSlot
}) => {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    preselectedSlot?.location_id || (locations[0]?.location_id || 'LOC001')
  );
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | ''>(preselectedSlot?.id || '');
  const [customerName, setCustomerName] = useState<string>('Alex Morgan');
  const [vehicleNumber, setVehicleNumber] = useState<string>('CA-99KP88');
  const [phone, setPhone] = useState<string>('+1 (555) 019-2834');
  const [email, setEmail] = useState<string>('alex.m@example.com');
  const [durationHours, setDurationHours] = useState<number>(2);

  // Filter
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await fetchReservations();
      setReservations(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (locId: string) => {
    try {
      const data = await fetchLocationSlots(locId);
      const onlyAvailable = data.filter((s) => s.status === 'Available');
      setAvailableSlots(onlyAvailable);
      if (onlyAvailable.length > 0 && !preselectedSlot) {
        setSelectedSlotId(onlyAvailable[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  useEffect(() => {
    loadAvailableSlots(selectedLocationId);
  }, [selectedLocationId]);

  useEffect(() => {
    if (preselectedSlot) {
      setSelectedLocationId(preselectedSlot.location_id);
      setSelectedSlotId(preselectedSlot.id);
    }
  }, [preselectedSlot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) {
      setNotification({ type: 'error', message: 'Please select an available parking bay.' });
      return;
    }

    try {
      setSubmitting(true);
      const created = await createReservation({
        slot_id: Number(selectedSlotId),
        location_id: selectedLocationId,
        customer_name: customerName,
        vehicle_number: vehicleNumber,
        phone,
        email,
        duration_hours: Number(durationHours)
      });

      setNotification({
        type: 'success',
        message: `Reservation ${created.reservation_code} simulated successfully! Bay ${created.slot_number} marked Reserved.`
      });

      if (onClearPreselectedSlot) onClearPreselectedSlot();
      await loadReservations();
      await loadAvailableSlots(selectedLocationId);
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to simulate reservation' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this simulated reservation?')) return;
    try {
      const cancelled = await cancelReservation(id);
      setNotification({
        type: 'success',
        message: `Reservation ${cancelled.reservation_code} cancelled. Bay ${cancelled.slot_number} returned to Available.`
      });
      await loadReservations();
      await loadAvailableSlots(selectedLocationId);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to cancel reservation' });
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.customer_name.toLowerCase().includes(q) ||
        r.vehicle_number.toLowerCase().includes(q) ||
        r.reservation_code.toLowerCase().includes(q) ||
        r.slot_number.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Ticket className="w-3.5 h-3.5" />
          Module 6: Reservation Simulation
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Slot Reservation & Lifecycle Simulator
        </h1>
        <p className="mt-1 text-slate-300 text-sm max-w-3xl leading-relaxed">
          Simulate end-to-end customer bookings on vacant bays. Changing slot status to Reserved updates the interactive layout and persists to the SQLite database.
        </p>
      </div>

      {/* Simulation Disclaimer Label */}
      <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <p className="text-xs text-amber-200/90 leading-relaxed">
          <strong className="text-amber-300 font-semibold uppercase tracking-wider mr-1">Demonstration Notice:</strong>
          This module is a fully functional reservation lifecycle simulator for software and ML integration testing. No actual financial payment or physical gate actuation occurs.
        </p>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 border animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Booking Form (Col 5) */}
        <div className="lg:col-span-5">
          <div className="glass-panel rounded-3xl p-6 sm:p-7">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Simulate New Parking Reservation
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Location Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Parking Facility
                </label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => {
                    setSelectedLocationId(e.target.value);
                    if (onClearPreselectedSlot) onClearPreselectedSlot();
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bay Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Available Parking Bay</span>
                  <span className="text-[11px] text-emerald-400 font-normal">
                    {availableSlots.length} bays vacant
                  </span>
                </label>
                {availableSlots.length === 0 ? (
                  <div className="p-3 bg-slate-900/80 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                    No available bays at this garage right now.
                  </div>
                ) : (
                  <select
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(Number(e.target.value))}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  >
                    {availableSlots.map((s) => (
                      <option key={s.id} value={s.id}>
                        Bay {s.slot_number} — {s.floor} ({s.zone}) - {s.slot_type}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Customer Full Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Vehicle Registration Plate */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-amber-400" />
                  Vehicle License Plate
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  required
                  placeholder="e.g. CA-8XYZ91"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Reservation Window
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>1 Hour Duration</option>
                  <option value={2}>2 Hours Duration</option>
                  <option value={4}>4 Hours Duration</option>
                  <option value={8}>8 Hours Duration (Full Day)</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || availableSlots.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Writing to Database...</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      <span>Confirm Simulated Reservation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* History Table (Col 7) */}
        <div className="lg:col-span-7">
          <div className="glass-panel rounded-3xl p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-blue-400" />
                  Reservation Ledger & History
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {filteredReservations.length} total reservations recorded in SQLite database.
                </p>
              </div>

              {/* Search & Status Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name/plate..."
                    className="bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-44"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-24 text-center">
                <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading reservation records...</p>
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No reservation records match your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Code / Bay</th>
                      <th className="py-2.5 px-3">Customer & Vehicle</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Time Window</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredReservations.map((r) => {
                      const isActive = r.status === 'Active';
                      return (
                        <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-white block">
                              {r.reservation_code}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                              Bay {r.slot_number}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-medium text-white block">{r.customer_name}</span>
                            <span className="text-[10px] font-mono text-amber-300">{r.vehicle_number}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-300 text-[11px]">
                            {r.location_name}
                          </td>
                          <td className="py-3 px-3 text-[11px] text-slate-400 font-mono">
                            <div>{new Date(r.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            {r.end_time && (
                              <div className="text-[10px] text-slate-500">
                                until {new Date(r.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <StatusBadge status={r.status} size="sm" />
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isActive ? (
                              <button
                                onClick={() => handleCancel(r.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500">Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
