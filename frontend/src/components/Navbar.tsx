import React, { useState } from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  Grid3X3,
  MapPin,
  BarChart3,
  Ticket,
  Activity,
  Info,
  Menu,
  X,
  Radio,
  Cpu,
  Search,
  Lock,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  serverOnline: boolean;
  simulationMode: boolean;
  onTriggerTick?: () => void;
  onNavigateToAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  serverOnline,
  simulationMode,
  onTriggerTick,
  onNavigateToAdmin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'reserve_wizard', label: 'Find & Reserve', icon: PlusCircle, highlight: true },
    { id: 'my_booking', label: 'My Booking', icon: Search },
    { id: 'predict', label: 'Prediction', icon: BrainCircuit },
    { id: 'layout', label: 'Parking Layout', icon: Grid3X3 },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'performance', label: 'ML Performance', icon: Activity },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B132B]/90 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#0B132B] rounded-[10px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">SMARTPARK</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium hidden sm:block">
                Public Parking Reservation Platform
              </p>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                      : item.highlight
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Status & Admin Gateway */}
          <div className="flex items-center gap-2.5">
            {/* Simulation trigger quick-button */}
            {onTriggerTick && (
              <button
                onClick={onTriggerTick}
                title="Simulate vehicle arrival/departure tick"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-medium transition-colors cursor-pointer"
              >
                <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
                <span className="hidden md:inline">Simulate</span>
              </button>
            )}

            {/* Server Online Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium">
              <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
              <span className={serverOnline ? 'text-emerald-400' : 'text-rose-400'}>
                {serverOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Dedicated Admin Portal Link Button (URL: /admin) */}
            <button
              onClick={onNavigateToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:border-slate-600"
              title="Application Owner & Administrator Dashboard (/admin)"
            >
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Portal</span>
            </button>

            {/* Mobile menu button */}
            <div className="xl:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#0B132B] border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
