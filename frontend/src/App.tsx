import React, { useState, useEffect } from 'react';
import {
  fetchDashboard,
  fetchHealth,
  triggerSimulationTick,
  resetSimulation,
  fetchAdminProfile,
  isAdminLoggedIn,
  clearAdminToken
} from './services/api';
import { DashboardStats, SlotItem, AdminUser, PublicReservation } from './types';
import { Navbar } from './components/Navbar';
import { ModuleDashboard } from './components/ModuleDashboard';
import { ModulePrediction } from './components/ModulePrediction';
import { ModuleParkingLayout } from './components/ModuleParkingLayout';
import { ModuleLocations } from './components/ModuleLocations';
import { ModuleAnalytics } from './components/ModuleAnalytics';
import { ModuleMLPerformance } from './components/ModuleMLPerformance';
import { ModuleAbout } from './components/ModuleAbout';
import { PublicReservationWizard } from './components/PublicReservationWizard';
import { PublicBookingLookup } from './components/PublicBookingLookup';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { Cpu, ShieldCheck } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [serverOnline, setServerOnline] = useState<boolean>(false);
  const [tickMessage, setTickMessage] = useState<string | null>(null);

  // Admin routing state (/admin)
  const isInitialAdminPath = window.location.pathname.startsWith('/admin') || window.location.hash.includes('admin');
  const [isAdminView, setIsAdminView] = useState<boolean>(isInitialAdminPath);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [checkingAdminAuth, setCheckingAdminAuth] = useState<boolean>(false);

  // Cross-module preselection states
  const [selectedLocationId, setSelectedLocationId] = useState<string>('LOC001');
  const [preselectedSlotForBooking, setPreselectedSlotForBooking] = useState<SlotItem | null>(null);

  // Check admin session if in admin view
  const verifyAdminSession = async () => {
    if (isAdminLoggedIn()) {
      try {
        setCheckingAdminAuth(true);
        const profile = await fetchAdminProfile();
        setCurrentAdmin(profile);
      } catch (err) {
        console.warn('Admin token invalid or expired. Prompting login.');
        clearAdminToken();
        setCurrentAdmin(null);
      } finally {
        setCheckingAdminAuth(false);
      }
    } else {
      setCurrentAdmin(null);
    }
  };

  useEffect(() => {
    if (isAdminView) {
      verifyAdminSession();
    }
  }, [isAdminView]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const isPathAdmin = window.location.pathname.startsWith('/admin') || window.location.hash.includes('admin');
      setIsAdminView(isPathAdmin);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setIsAdminView(true);
  };

  const navigateToPublic = (targetTab: string = 'dashboard') => {
    window.history.pushState({}, '', '/');
    setIsAdminView(false);
    setActiveTab(targetTab);
  };

  const loadData = async () => {
    try {
      const health = await fetchHealth();
      setServerOnline(health.status === 'healthy');
      const data = await fetchDashboard();
      setStats(data);
    } catch (err) {
      console.error('API connection error:', err);
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerTick = async () => {
    try {
      const res = await triggerSimulationTick(selectedLocationId, 2);
      setTickMessage(res.message);
      await loadData();
      setTimeout(() => setTickMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleResetSimulation = async () => {
    try {
      const res = await resetSimulation(selectedLocationId);
      setTickMessage(res.message);
      await loadData();
      setTimeout(() => setTickMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Navigations with context
  const handleSelectLocationForLayout = (locId: string) => {
    setSelectedLocationId(locId);
    setActiveTab('layout');
  };

  const handleSelectLocationForPrediction = (locId: string) => {
    setSelectedLocationId(locId);
    setActiveTab('predict');
  };

  const handleOpenReservationModal = (slot: SlotItem) => {
    setPreselectedSlotForBooking(slot);
    setSelectedLocationId(slot.location_id);
    setActiveTab('reserve_wizard');
  };

  // RENDER ADMIN VIEW (/admin)
  if (isAdminView) {
    return (
      <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {checkingAdminAuth ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">Verifying administrator credentials...</p>
            </div>
          ) : currentAdmin ? (
            <AdminDashboard
              admin={currentAdmin}
              locations={stats?.locations || []}
              onLogout={() => setCurrentAdmin(null)}
              onBackToPublic={() => navigateToPublic('dashboard')}
            />
          ) : (
            <AdminLogin
              onLoginSuccess={(adminProfile) => setCurrentAdmin(adminProfile)}
              onBackToPublic={() => navigateToPublic('dashboard')}
            />
          )}
        </main>
      </div>
    );
  }

  // RENDER PUBLIC CUSTOMER PLATFORM
  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Public Navbar with Module Links & Admin Portal Entry */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serverOnline={serverOnline}
        simulationMode={true}
        onTriggerTick={handleTriggerTick}
        onNavigateToAdmin={navigateToAdmin}
      />

      {/* Main Public Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <ModuleDashboard
            stats={stats}
            loading={loading}
            onNavigateTab={(tab) => {
              if (tab === 'reservations') {
                setActiveTab('reserve_wizard');
              } else {
                setActiveTab(tab);
              }
            }}
            onTriggerTick={handleTriggerTick}
            onResetSimulation={handleResetSimulation}
            tickMessage={tickMessage}
          />
        )}

        {activeTab === 'reserve_wizard' && (
          <PublicReservationWizard
            locations={stats?.locations || []}
            preselectedLocationId={selectedLocationId}
            preselectedSlot={preselectedSlotForBooking}
            onBookingSuccess={() => loadData()}
            onNavigateToLookup={() => setActiveTab('my_booking')}
          />
        )}

        {activeTab === 'my_booking' && <PublicBookingLookup />}

        {activeTab === 'predict' && (
          <ModulePrediction
            locations={stats?.locations || []}
            selectedLocationId={selectedLocationId}
            onNavigateTab={(tab) => {
              if (tab === 'reservations') {
                setActiveTab('reserve_wizard');
              } else {
                setActiveTab(tab);
              }
            }}
          />
        )}

        {activeTab === 'layout' && (
          <ModuleParkingLayout
            locations={stats?.locations || []}
            selectedLocationId={selectedLocationId}
            onOpenReservationModal={handleOpenReservationModal}
          />
        )}

        {activeTab === 'locations' && (
          <ModuleLocations
            locations={stats?.locations || []}
            onSelectLocationForLayout={handleSelectLocationForLayout}
            onSelectLocationForPrediction={handleSelectLocationForPrediction}
          />
        )}

        {activeTab === 'analytics' && <ModuleAnalytics />}

        {activeTab === 'performance' && <ModuleMLPerformance />}

        {activeTab === 'about' && <ModuleAbout />}
      </main>

      {/* Public Footer with Admin Link */}
      <footer className="border-t border-slate-800/80 bg-slate-950/40 py-8 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white tracking-wide">SMARTPARK AI</span>
            <span className="text-slate-600">•</span>
            <span>Public Smart Parking Reservation & Prediction Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>React 19 + TypeScript</span>
            <span>•</span>
            <span>FastAPI + SQLite</span>
            <span>•</span>
            <span>Scikit-learn Regressors</span>
            <span>•</span>
            <button
              onClick={navigateToAdmin}
              className="text-blue-400 hover:text-blue-300 underline font-semibold cursor-pointer"
            >
              Owner Admin Portal (/admin)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
