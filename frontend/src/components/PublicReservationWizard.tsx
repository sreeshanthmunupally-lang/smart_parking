import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Car,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Ticket,
  Copy,
  Printer,
  ShieldCheck,
  Zap,
  DollarSign
} from 'lucide-react';
import { LocationItem, SlotItem, PublicReservation } from '../types';
import { fetchPublicSlots, createPublicReservation } from '../services/api';
import { StatusBadge } from './StatusBadge';

interface PublicReservationWizardProps {
  locations: LocationItem[];
  preselectedLocationId?: string;
  preselectedSlot?: SlotItem | null;
  onBookingSuccess?: (booking: PublicReservation) => void;
  onNavigateToLookup?: () => void;
}

export const PublicReservationWizard: React.FC<PublicReservationWizardProps> = ({
  locations,
  preselectedLocationId,
  preselectedSlot,
  onBookingSuccess,
  onNavigateToLookup
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [step, setStep] = useState<number>(preselectedSlot ? 2 : 1);
  const [selectedLocId, setSelectedLocId] = useState<string>(
    preselectedLocationId || locations[0]?.location_id || 'LOC001'
  );
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(preselectedSlot?.id || null);

  // Form Inputs
  const [arrivalDate, setArrivalDate] = useState<string>(defaultDateStr);
  const [arrivalTime, setArrivalTime] = useState<string>('14:00');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');

  // Submission & Result
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<PublicReservation | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Slot filter
  const [filterType, setFilterType] = useState<string>('All');

  const loadSlotsForLocation = async (locId: string) => {
    try {
      setLoadingSlots(true);
      const data = await fetchPublicSlots(locId);
      setSlots(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadSlotsForLocation(selectedLocId);
  }, [selectedLocId]);

  useEffect(() => {
    if (preselectedSlot) {
      setSelectedLocId(preselectedSlot.location_id);
      setSelectedSlotId(preselectedSlot.id);
      setStep(2);
    }
  }, [preselectedSlot]);

  const activeLocation = locations.find((l) => l.location_id === selectedLocId) || locations[0];
  const activeSlot = slots.find((s) => s.id === selectedSlotId);

  const availableSlots = slots.filter((s) => {
    if (s.status !== 'Available') return false;
    if (filterType !== 'All' && s.slot_type !== filterType) return false;
    return true;
  });

  const totalPrice = activeLocation ? (activeLocation.hourly_rate * durationHours).toFixed(2) : '0.00';

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) {
      setErrorMessage('Please select a parking bay.');
      return;
    }
    if (!customerName || !customerPhone || !vehicleNumber) {
      setErrorMessage('Please fill in customer name, phone number, and vehicle plate.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      const res = await createPublicReservation({
        location_id: selectedLocId,
        slot_id: selectedSlotId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || undefined,
        vehicle_number: vehicleNumber,
        arrival_date: arrivalDate,
        arrival_time: arrivalTime,
        duration_hours: durationHours
      });

      setConfirmedBooking(res);
      setStep(3); // Confirmation step
      if (onBookingSuccess) onBookingSuccess(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyReference = () => {
    if (confirmedBooking) {
      navigator.clipboard.writeText(confirmedBooking.booking_reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Step Progress Bar */}
      {step < 3 && (
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              1
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Select Location & Bay</p>
              <p className="text-[10px] text-slate-400">Choose garage & parking spot</p>
            </div>
          </div>

          <div className="w-12 h-0.5 bg-slate-800" />

          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              2
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Driver & Arrival Details</p>
              <p className="text-[10px] text-slate-400">Date, vehicle & contact</p>
            </div>
          </div>

          <div className="w-12 h-0.5 bg-slate-800" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Instant Confirmation</p>
              <p className="text-[10px] text-slate-500">Booking reference & receipt</p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: SELECT GARAGE & BAY */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-7">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              1. Choose Parking Garage
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Select your destination facility to view real-time bay availability.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {locations.map((loc) => {
                const isSelected = loc.location_id === selectedLocId;
                return (
                  <button
                    key={loc.location_id}
                    onClick={() => {
                      setSelectedLocId(loc.location_id);
                      setSelectedSlotId(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[10px] font-mono font-bold text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10">
                        {loc.location_id}
                      </span>
                      <StatusBadge status={loc.demand_level} size="sm" />
                    </div>
                    <h3 className="text-sm font-bold text-white mt-2">{loc.name}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{loc.address}</p>
                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                      <span className="text-emerald-400 font-semibold">{loc.available} vacant bays</span>
                      <span className="text-slate-300 font-bold">${loc.hourly_rate.toFixed(2)}/hr</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bay Selection Matrix */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-400" />
                  2. Select Available Parking Spot ({activeLocation.name})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click on an available bay (Green) to select it for your reservation.
                </p>
              </div>

              {/* Bay Type Filter */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                {['All', 'Standard', 'EV Charging', 'Accessible', 'VIP'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filterType === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === 'EV Charging' ? '⚡ EV' : t === 'Accessible' ? '♿ Acc' : t}
                  </button>
                ))}
              </div>
            </div>

            {loadingSlots ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading live parking bays...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No vacant bays matching "{filterType}" at this location right now.
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {slots.map((slot) => {
                  const isAvailable = slot.status === 'Available';
                  const isSelected = selectedSlotId === slot.id;

                  let styleClass = 'bg-rose-500/10 border-rose-500/30 text-rose-400/60 cursor-not-allowed';
                  if (slot.status === 'Reserved') {
                    styleClass = 'bg-amber-500/10 border-amber-500/30 text-amber-400/60 cursor-not-allowed';
                  } else if (isAvailable) {
                    styleClass = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer';
                  }

                  if (isSelected) {
                    styleClass = 'bg-blue-600 border-white text-white ring-2 ring-blue-400 scale-105 shadow-lg';
                  }

                  return (
                    <button
                      key={slot.id}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${styleClass}`}
                    >
                      <Car className="w-5 h-5 mb-1" />
                      <span className="font-mono text-xs font-bold">{slot.slot_number}</span>
                      <span className="text-[9px] mt-0.5 truncate w-full text-center opacity-80">
                        {slot.slot_type === 'EV Charging' ? '⚡ EV' : slot.slot_type === 'Accessible' ? '♿' : slot.slot_type === 'VIP' ? '★ VIP' : 'Std'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected slot summary bar & Next step */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {activeSlot ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Selected Bay:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      Bay {activeSlot.slot_number}
                    </span>
                    <span className="text-slate-500">({activeSlot.floor}, {activeSlot.zone} - {activeSlot.slot_type})</span>
                  </div>
                ) : (
                  <p className="text-xs text-amber-400">Please click an available green bay above to proceed.</p>
                )}
              </div>

              <button
                disabled={!selectedSlotId}
                onClick={() => setStep(2)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold text-xs py-2.5 px-5 rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <span>Continue to Booking Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: DRIVER & ARRIVAL DETAILS */}
      {step === 2 && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                Driver & Reservation Information
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Reserving <strong className="text-emerald-400">Bay {activeSlot?.slot_number}</strong> at <strong className="text-white">{activeLocation.name}</strong>.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Bay</span>
            </button>
          </div>

          <form onSubmit={handleConfirmReservation} className="space-y-6">
            {/* Arrival & Duration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Arrival Date
                </label>
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Arrival Time
                </label>
                <input
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Parking Duration
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours (Standard)</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={6}>6 Hours</option>
                  <option value={8}>8 Hours (Work Day)</option>
                  <option value={24}>24 Hours (Full Day)</option>
                </select>
              </div>
            </div>

            {/* Customer Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Customer Full Name *
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Mobile Phone Number * (Used for Booking Lookup)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  placeholder="e.g. 555-019-2834"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-amber-400" />
                  Vehicle License Plate *
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. sarah.j@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Price Breakdown Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400">Calculated Parking Tariff:</span>
                <p className="text-xs text-slate-300 mt-0.5">
                  ${activeLocation.hourly_rate.toFixed(2)}/hr × {durationHours} hours
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Total Due Upon Arrival:</span>
                <p className="text-2xl font-black text-emerald-400">${totalPrice}</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Back to Map
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold text-xs py-3 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Confirming with Database...</span>
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4" />
                    <span>Confirm Public Reservation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: BOOKING CONFIRMATION & RECEIPT */}
      {step === 3 && confirmedBooking && (
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border-2 border-emerald-500/40 space-y-6 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Reservation Confirmed & Guaranteed
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Your Parking Bay Is Secured!
            </h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
              Show this reference upon arriving at the facility barrier or entry gate. The designated bay has been reserved under your license plate.
            </p>
          </div>

          {/* Reference Pill */}
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 max-w-md mx-auto flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Booking Reference</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-wider">
                {confirmedBooking.booking_reference}
              </span>
            </div>
            <button
              onClick={copyReference}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copy Reference"
            >
              {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          {/* Receipt Breakdown Grid */}
          <div className="bg-slate-900/60 rounded-2xl p-5 max-w-lg mx-auto border border-slate-800 text-left text-xs space-y-3">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Facility Location:</span>
              <span className="font-semibold text-white">{confirmedBooking.location_name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Assigned Bay:</span>
              <span className="font-mono font-bold text-emerald-400">
                Bay {confirmedBooking.slot_number} ({confirmedBooking.floor}, {confirmedBooking.zone})
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Customer Name:</span>
              <span className="font-medium text-white">{confirmedBooking.customer_name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Phone Verification:</span>
              <span className="font-mono text-slate-300">{confirmedBooking.customer_phone_masked}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Vehicle License Plate:</span>
              <span className="font-mono font-bold text-amber-300">{confirmedBooking.vehicle_number}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Scheduled Arrival:</span>
              <span className="font-mono text-white">
                {new Date(confirmedBooking.arrival_time).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Parking Window:</span>
              <span className="text-slate-300">{confirmedBooking.duration_hours} Hours</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-bold">
              <span className="text-slate-300">Total Tariff:</span>
              <span className="text-emerald-400">${confirmedBooking.total_price.toFixed(2)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Confirmation Receipt</span>
            </button>

            {onNavigateToLookup && (
              <button
                onClick={onNavigateToLookup}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold cursor-pointer"
              >
                <span>Find or Manage My Booking</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                setConfirmedBooking(null);
                setStep(1);
                setSelectedSlotId(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Book Another Spot
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
