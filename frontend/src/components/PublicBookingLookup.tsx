import React, { useState } from 'react';
import {
  Search,
  Phone,
  Ticket,
  Calendar,
  Clock,
  Car,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { PublicReservation } from '../types';
import { lookupPublicReservation, cancelPublicReservation } from '../services/api';
import { StatusBadge } from './StatusBadge';

export const PublicBookingLookup: React.FC = () => {
  const [bookingReference, setBookingReference] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [booking, setBooking] = useState<PublicReservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingReference.trim() || !phoneNumber.trim()) {
      setError('Please provide both your booking reference and phone number.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      const res = await lookupPublicReservation(bookingReference.trim(), phoneNumber.trim());
      setBooking(res);
    } catch (err: any) {
      setError(err.message || 'No reservation found for the given reference and phone number.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel booking ${booking.booking_reference}? Your reserved bay (${booking.slot_number}) will be released.`
    );
    if (!confirmCancel) return;

    try {
      setCancelling(true);
      setError(null);
      const res = await cancelPublicReservation(booking.booking_reference, phoneNumber, 'Customer requested online cancellation');
      setBooking(res);
      setSuccessMessage('Your reservation has been successfully cancelled and the bay released.');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel reservation.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Ticket className="w-3.5 h-3.5" />
          Public Customer Portal
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Find & Manage Existing Reservation
        </h1>
        <p className="mt-1 text-slate-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          Verify your booking reference and phone number to inspect your slot details or cancel your reservation anytime.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-blue-400" />
                Booking Reference Code *
              </label>
              <input
                type="text"
                value={bookingReference}
                onChange={(e) => setBookingReference(e.target.value)}
                placeholder="e.g. SPK-20261111-886A"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Verification Phone Number *
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 555-892-1044"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Searching SQLite Database...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Find My Reservation</span>
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-3 animate-fadeIn">
          <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Reservation Result Card */}
      {booking && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Booking Reference</span>
              <h3 className="text-xl font-black text-white font-mono mt-0.5">{booking.booking_reference}</h3>
            </div>
            <StatusBadge status={booking.status} size="lg" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Facility & Bay</span>
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="font-semibold text-white">{booking.location_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reserved Bay:</span>
                <span className="font-mono font-bold text-emerald-400">Bay {booking.slot_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Floor & Zone:</span>
                <span className="text-slate-300">{booking.floor} ({booking.zone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bay Type:</span>
                <span className="text-slate-300">{booking.slot_type}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Customer & Schedule</span>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer Name:</span>
                <span className="font-medium text-white">{booking.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone Verification:</span>
                <span className="font-mono text-slate-300">{booking.customer_phone_masked}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vehicle License:</span>
                <span className="font-mono font-bold text-amber-300">{booking.vehicle_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Arrival:</span>
                <span className="font-mono text-white">{new Date(booking.arrival_time).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Window & Fee:</span>
                <span className="text-emerald-400 font-bold">{booking.duration_hours} hrs (${booking.total_price.toFixed(2)})</span>
              </div>
            </div>
          </div>

          {/* Cancellation section */}
          {booking.status === 'CONFIRMED' && (
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-300 font-medium">Need to change your parking plans?</p>
                <p className="text-[11px] text-slate-500">Cancelling immediately frees this parking spot for other drivers.</p>
              </div>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                {cancelling ? 'Releasing Bay...' : 'Cancel This Reservation'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
