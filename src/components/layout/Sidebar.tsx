import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Sparkles,
  Building2,
  Bike,
  BarChart3,
  Settings,
  Leaf,
  HeartHandshake,
  Clock,
  Flame,
  Bot,
  User,
  Shield,
} from 'lucide-react';
import { RoleBadge } from '../common/Badge';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, stats, urgentDonations, currentRole } = useApp();

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'donations',
      label: 'Food Donations',
      icon: UtensilsCrossed,
      badge: stats.activeDonationsCount > 0 ? stats.activeDonationsCount : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'find-food',
      label: 'Find Food (AI Match)',
      icon: Sparkles,
      badge: 'Smart Engine',
      badgeColor: 'bg-emerald-700 text-white',
    },
    {
      id: 'ngos',
      label: 'NGO Partners',
      icon: Building2,
      badge: stats.registeredNGOsCount,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'volunteers',
      label: 'Volunteer Coordination',
      icon: Bike,
    },
    {
      id: 'analytics',
      label: 'Impact Analytics',
      icon: BarChart3,
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      icon: Bot,
      badge: 'Live',
      badgeColor: 'bg-emerald-500 text-slate-950',
    },
    {
      id: 'settings',
      label: 'Settings & Demo Controls',
      icon: Settings,
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0d2a1b] text-emerald-50 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-950/40">
              <Leaf className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">FoodBridge</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/80 font-medium tracking-wide">Zero Food Waste Grid</p>
            </div>
          </div>
        </div>

        {/* Current Active Role Indicator */}
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-between text-xs">
          <span className="text-emerald-400 font-semibold text-[11px]">Role Mode:</span>
          <span className="font-bold text-white capitalize flex items-center gap-1">
            {currentRole === 'donor' && <User className="w-3.5 h-3.5 text-emerald-400" />}
            {currentRole === 'ngo' && <Building2 className="w-3.5 h-3.5 text-sky-400" />}
            {currentRole === 'volunteer' && <Bike className="w-3.5 h-3.5 text-amber-400" />}
            {currentRole === 'admin' && <Shield className="w-3.5 h-3.5 text-purple-400" />}
            {currentRole}
          </span>
        </div>

        {/* Urgent Alert Snippet in Sidebar */}
        {urgentDonations.length > 0 && (
          <div className="mx-3 mt-2.5 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{urgentDonations.length} Urgent Cutoff{urgentDonations.length > 1 ? 's' : ''}</span>
            </div>
            <p className="text-[11px] text-amber-200/80 mt-0.5 line-clamp-1">
              Food approaching pickup deadline.
            </p>
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-900/50'
                    : 'text-emerald-100/70 hover:text-white hover:bg-emerald-900/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                      item.badgeColor || 'bg-emerald-900 text-emerald-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Impact summary card in sidebar */}
        <div className="p-3.5 m-3 rounded-2xl bg-emerald-900/40 border border-emerald-800/50">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-1">
            <span className="flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
              Redistributed Meals
            </span>
            <span className="text-white font-bold">{stats.mealsRedistributed}</span>
          </div>
          <div className="w-full bg-emerald-950 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, (stats.mealsRedistributed / 500) * 100))}%` }}
            />
          </div>
          <p className="text-[10px] text-emerald-400/80 mt-1.5 text-right font-mono">
            {stats.co2KgSaved} kg CO₂ prevented
          </p>
        </div>

        {/* Footer info */}
        <div className="p-3.5 border-t border-emerald-800/60 bg-[#092014] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-emerald-100 text-xs">
              FB
            </div>
            <div>
              <p className="font-semibold text-white leading-tight">FoodBridge AI</p>
              <p className="text-[10px] text-emerald-400">Zero Food Waste Grid</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
            v2.0 MVP
          </span>
        </div>
      </aside>
    </>
  );
};
