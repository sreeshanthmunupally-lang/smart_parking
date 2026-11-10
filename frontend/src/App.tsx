import React, { useState, useEffect } from 'react';
import {
  fetchDashboard,
  fetchHealth,
  triggerSimulationTick,
  resetSimulation
} from './services/api';
import { DashboardStats, SlotItem } from './types';
import { Navbar } from './components/Navbar';
import { ModuleDashboard } from './components/ModuleDashboard';
import { ModulePrediction } from './components/ModulePrediction';
import { ModuleParkingLayout } from './components/ModuleParkingLayout';
import { ModuleLocations } from './components/ModuleLocations';
import { ModuleAnalytics } from './components/ModuleAnalytics';
import { ModuleReservations } from './components/ModuleReservations';
import { ModuleMLPerformance } from './components/ModuleMLPerformance';
import { ModuleAbout } from './components/ModuleAbout';
import { Cpu, ShieldCheck, Heart } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [serverOnline, setServerOnline] = useState<boolean>(false);
  const [tickMessage, setTickMessage] = useState<string | null>(null);

  // Cross-module preselection states
  const [selectedLocationId, setSelectedLocationId] = useState<string>('LOC001');
  const [preselectedSlotForBooking, setPreselectedSlotForBooking] = useState<SlotItem | null>(null);

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
    // Poll dashboard every 15s to keep overview fresh
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
    setActiveTab('reservations');
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar with Module Links & Status */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serverOnline={serverOnline}
        simulationMode={true}
        onTriggerTick={handleTriggerTick}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <ModuleDashboard
            stats={stats}
            loading={loading}
            onNavigateTab={setActiveTab}
            onTriggerTick={handleTriggerTick}
            onResetSimulation={handleResetSimulation}
            tickMessage={tickMessage}
          />
        )}

        {activeTab === 'predict' && (
          <ModulePrediction
            locations={stats?.locations || []}
            selectedLocationId={selectedLocationId}
            onNavigateTab={setActiveTab}
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

        {activeTab === 'reservations' && (
          <ModuleReservations
            locations={stats?.locations || []}
            preselectedSlot={preselectedSlotForBooking}
            onClearPreselectedSlot={() => setPreselectedSlotForBooking(null)}
          />
        )}

        {activeTab === 'performance' && <ModuleMLPerformance />}

        {activeTab === 'about' && <ModuleAbout />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/40 py-8 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white tracking-wide">SMARTPARK AI</span>
            <span className="text-slate-600">•</span>
            <span>Smart Parking Availability Prediction and Management System</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>React + TypeScript</span>
            <span>•</span>
            <span>Python FastAPI</span>
            <span>•</span>
            <span>Scikit-learn Regressors</span>
            <span>•</span>
            <span>SQLite Database</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
