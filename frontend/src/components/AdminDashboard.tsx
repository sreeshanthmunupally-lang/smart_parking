import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Bell,
  Download,
  Search,
  Filter,
  Calendar,
  Layers,
  Car,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogOut,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Building,
  Check,
  Eye,
  FileSpreadsheet,
  X
} from 'lucide-react';
import {
  AdminUser,
  AdminStats,
  AdminReservation,
  AdminNotification,
  LocationItem
} from '../types';
import {
  fetchAdminStats,
  fetchAdminReservations,
  updateAdminReservationStatus,
  downloadAdminReservationsCsv,
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  clearAdminToken
} from '../services/api';
import { StatCard } from './StatCard';
import { StatusBadge } from './StatusBadge';

interface AdminDashboardProps {
  admin: AdminUser;
  locations: LocationItem[];
  onLogout: () => void;
  onBackToPublic: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  admin,
  locations,
  onLogout,
  onBackToPublic
}) => {
  // Stats & Filters
  const [period, setPeriod] = useState<string>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  // Reservations Table & Filters
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');

  // Notifications
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Modal Detail
  const [selectedReservation, setSelectedReservation] = useState<AdminReservation | null>(null);
  const [statusActionMessage, setStatusActionMessage] = useState<string | null>(null);

  // Load Overview Statistics
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetchAdminStats(
        period,
        period === 'custom' ? customStart : undefined,
        period === 'custom' ? customEnd : undefined
      );
      setStats(res);
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load Reservations Table
  const loadReservations = async () => {
    try {
      setLoadingReservations(true);
      const data = await fetchAdminReservations(
        searchQuery || undefined,
        locationFilter,
        statusFilter,
        sortOrder,
        150
      );
      setReservations(data);
    } catch (err: any) {
      console.error('Failed to load admin reservations:', err);
    } finally {
      setLoadingReservations(false);
    }
  };

  // Load Notifications
  const loadNotifications = async () => {
    try {
      const data = await fetchAdminNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, [period, customStart, customEnd]);

  useEffect(() => {
    loadReservations();
  }, [searchQuery, locationFilter, statusFilter, sortOrder]);

  // Initial & Live 5s Polling for Notifications and Stats
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => {
      loadNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (id: number, newStatus: string, reason?: string) => {
    try {
      await updateAdminReservationStatus(id, newStatus, reason);
      setStatusActionMessage(`Reservation #${id} status updated to ${newStatus}.`);
      await loadReservations();
      await loadStats();
      if (selectedReservation && selectedReservation.id === id) {
        setSelectedReservation({
          ...selectedReservation,
          status: newStatus as any,
          cancellation_reason: reason
        });
      }
      setTimeout(() => setStatusActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update reservation status');
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await downloadAdminReservationsCsv(
        statusFilter !== 'all' ? statusFilter : undefined,
        locationFilter !== 'all' ? locationFilter : undefined
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartpark_reservations_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('CSV export failed: ' + err.message);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllAdminNotificationsRead();
      await loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoutClick = () => {
    clearAdminToken();
    onLogout();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Admin Navigation & Utility Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-400 p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-[#0B132B] rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white">Application Owner Dashboard</h1>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                {admin.role}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Authenticated Operator: <strong className="text-white">{admin.full_name}</strong> (@{admin.username})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Admin Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0B132B] border border-slate-700 rounded-2xl shadow-2xl z-50 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Live Booking Alerts</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No notifications recorded.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={async () => {
                          if (!n.is_read) {
                            await markAdminNotificationRead(n.id);
                            loadNotifications();
                          }
                        }}
                        className={`p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                          n.is_read
                            ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                            : 'bg-blue-950/40 border-blue-500/40 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-[11px]">{n.title}</span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">{n.message}</p>
                        {n.booking_reference && (
                          <span className="inline-block mt-1 font-mono text-[10px] text-emerald-400">
                            Ref: {n.booking_reference}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Refresh */}
          <button
            onClick={() => {
              loadStats();
              loadReservations();
              loadNotifications();
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh All Records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Back to Public Site */}
          <button
            onClick={onBackToPublic}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {statusActionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{statusActionMessage}</span>
        </div>
      )}

      {/* Date Period Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Period:</span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: 'custom', label: 'Custom Range' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setPeriod(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                period === btn.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
            />
          </div>
        )}
      </div>

      {/* 8 Core Admin Statistics Cards (Module 3 requirements) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Reservations"
          value={stats ? stats.total_reservations : '...'}
          subtitle="Cumulative bookings in period"
          icon={Layers}
          accentColor="blue"
        />
        <StatCard
          title="Confirmed Reservations"
          value={stats ? stats.confirmed_reservations : '...'}
          subtitle="Active / Validated"
          icon={CheckCircle2}
          accentColor="green"
        />
        <StatCard
          title="Cancelled Reservations"
          value={stats ? stats.cancelled_reservations : '...'}
          subtitle="Released bays"
          icon={XCircle}
          accentColor="rose"
        />
        <StatCard
          title="Upcoming Reservations"
          value={stats ? stats.upcoming_reservations : '...'}
          subtitle="Future arrival scheduled"
          icon={Clock}
          accentColor="amber"
        />
        <StatCard
          title="Completed Bookings"
          value={stats ? stats.completed_reservations : '...'}
          subtitle="Past window expired"
          icon={Check}
          accentColor="purple"
        />
        <StatCard
          title="Registered Customers"
          value={stats ? stats.total_customers : '...'}
          subtitle="Distinct client phone IDs"
          icon={User}
          accentColor="blue"
        />
        <StatCard
          title="Monitored Facilities"
          value={stats ? stats.total_locations : '...'}
          subtitle="Across municipal network"
          icon={Building}
          accentColor="green"
        />
        <StatCard
          title="Currently Reserved Bays"
          value={stats ? stats.current_reserved_slots : '...'}
          subtitle="Active parking locks"
          icon={Car}
          accentColor="amber"
        />
      </div>

      {/* Complete Reservation Management Table (Module 4 requirements) */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Reservation Management Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time audit log of all customer reservations recorded in the SQLite database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ref, name, phone, plate..."
                className="bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-60"
              />
            </div>

            {/* Location Filter */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
              title="Download CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {loadingReservations ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading reservation records...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No reservations found matching the current search & filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Customer & Phone</th>
                  <th className="py-3 px-3">Vehicle Plate</th>
                  <th className="py-3 px-3">Facility & Bay</th>
                  <th className="py-3 px-3">Arrival Schedule</th>
                  <th className="py-3 px-3">Booked At</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold text-white block">
                        {r.booking_reference}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        ${r.total_price.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-medium text-white block">{r.customer_name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{r.customer_phone}</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-amber-300">
                      {r.vehicle_number}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-white block font-medium">{r.location_name}</span>
                      <span className="font-mono text-[10px] text-blue-400 font-bold">Bay {r.slot_number}</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-300">
                      <div>{new Date(r.arrival_time).toLocaleDateString()} {new Date(r.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[10px] text-slate-500">Duration: {r.duration_hours}h</div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[10px] text-slate-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedReservation(r)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="View Full Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {r.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(r.id, 'COMPLETED')}
                              className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 cursor-pointer"
                              title="Mark as Completed"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Cancellation reason:');
                                if (reason !== null) handleStatusChange(r.id, 'CANCELLED', reason || 'Admin cancelled');
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 text-[10px] font-bold border border-rose-500/30 cursor-pointer"
                              title="Cancel Reservation"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual Reservation Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Booking Audit Card</span>
                <h3 className="text-lg font-black text-white font-mono">{selectedReservation.booking_reference}</h3>
              </div>
              <button
                onClick={() => setSelectedReservation(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Current Status:</span>
                <StatusBadge status={selectedReservation.status} size="sm" />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Customer Name:</span>
                <span className="font-semibold text-white">{selectedReservation.customer_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Phone Number:</span>
                <span className="font-mono text-emerald-400">{selectedReservation.customer_phone}</span>
              </div>
              {selectedReservation.customer_email && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-300">{selectedReservation.customer_email}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Vehicle Registration:</span>
                <span className="font-mono font-bold text-amber-300">{selectedReservation.vehicle_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Facility Location:</span>
                <span className="text-white font-medium">{selectedReservation.location_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Assigned Bay:</span>
                <span className="font-mono font-bold text-blue-400">Bay {selectedReservation.slot_number} (ID: {selectedReservation.slot_id})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Arrival Timestamp:</span>
                <span className="font-mono text-white">{new Date(selectedReservation.arrival_time).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Expiry Timestamp:</span>
                <span className="font-mono text-white">{new Date(selectedReservation.end_time).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Duration & Fee:</span>
                <span className="font-bold text-emerald-400">{selectedReservation.duration_hours} Hours (${selectedReservation.total_price.toFixed(2)})</span>
              </div>
              {selectedReservation.cancellation_reason && (
                <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-300 mt-2">
                  <span className="font-bold block text-[10px] uppercase">Cancellation Reason:</span>
                  <span>{selectedReservation.cancellation_reason}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedReservation(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
