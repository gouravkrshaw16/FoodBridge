import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Menu,
  PlusCircle,
  Play,
  RotateCcw,
  Sparkles,
  ChevronDown,
  User,
  Building2,
  Bike,
  Shield,
  Layers,
  LogIn,
  KeyRound,
} from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenAddDonation: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenAddDonation }) => {
  const { activeTab, currentRole, setCurrentRole, startGuidedDemo, isDemoActive, currentUser } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'Dashboard Overview',
          desc: 'Real-time monitoring of food surplus, redistribution velocity, and urgent needs',
        };
      case 'donations':
        return {
          title: 'Surplus Food Donations',
          desc: 'Manage donation batches, status life cycle, and thermal safety parameters',
        };
      case 'find-food':
        return {
          title: 'Intelligent Food Matching Engine',
          desc: 'Deterministic 5-factor scoring engine matching surplus meals with suitable verified NGOs',
        };
      case 'ngos':
        return {
          title: 'NGO & Community Partners',
          desc: 'Registered beneficiary shelters, daily capacity limits, and emergency requests',
        };
      case 'volunteers':
        return {
          title: 'Volunteer Coordination',
          desc: 'Dispatch active field couriers and track cold/hot food delivery transit',
        };
      case 'analytics':
        return {
          title: 'Impact Analytics',
          desc: 'Empirical data on meals redistributed, carbon offset, and water conservation',
        };
      case 'assistant':
        return {
          title: 'FoodBridge AI Assistant',
          desc: 'Operational intelligence, bottleneck detection, and data-backed recommendations',
        };
      case 'settings':
        return {
          title: 'Settings & Demo Controls',
          desc: 'Reset demo environment, toggle simulated time, and inspect system architecture',
        };
      default:
        return { title: 'FoodBridge AI', desc: 'Zero Food Waste Coordination Platform' };
    }
  };

  const { title, desc } = getPageTitle();

  const rolesList: { id: UserRole; label: string; icon: React.ElementType; desc: string }[] = [
    {
      id: 'admin',
      label: 'Administrator',
      icon: Shield,
      desc: 'Full operational control, audit log, metrics & settings',
    },
    {
      id: 'donor',
      label: 'Food Donor',
      icon: User,
      desc: 'Publish surplus, check pickup windows & track status',
    },
    {
      id: 'ngo',
      label: 'NGO / Recipient Shelter',
      icon: Building2,
      desc: 'Inspect food safety, claim compatible lots & confirm receipt',
    },
    {
      id: 'volunteer',
      label: 'Delivery Volunteer',
      icon: Bike,
      desc: 'Review assigned dispatches, confirm pickup & delivery',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">{title}</h1>
            <p className="text-xs text-slate-500 hidden sm:block">{desc}</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
              title="Switch user perspective for demonstration"
            >
              <span className="text-[10px] text-slate-400 font-bold uppercase hidden md:inline">Role:</span>
              <span className="font-bold text-slate-800 capitalize">{currentRole}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showRoleMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowRoleMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">Switch Demonstration Role</p>
                    <p className="text-[10px] text-slate-500">
                      Simulated client-side perspective for jury walkthrough
                    </p>
                  </div>
                  <div className="space-y-1 py-1">
                    {rolesList.map((r) => {
                      const Icon = r.icon;
                      const isSelected = currentRole === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => {
                            setCurrentRole(r.id);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-start gap-2.5 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-900 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                          <div>
                            <span className="block font-bold">{r.label}</span>
                            <span className="text-[10px] text-slate-500 leading-tight block">{r.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Guided Demo Button */}
          {!isDemoActive && (
            <button
              onClick={startGuidedDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
              title="Launch interactive 9-step guided walkthrough"
            >
              <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span className="hidden sm:inline">Start Guided Demo</span>
              <span className="sm:hidden">Demo</span>
            </button>
          )}

          {/* User Profile / Auth Button */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            title="Manage account, sign in or register"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">
              {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : <User className="w-3 h-3" />}
            </div>
            <span className="hidden lg:inline max-w-[120px] truncate">
              {currentUser ? currentUser.displayName : 'Sign In'}
            </span>
          </button>

          {/* Primary Action: Add Food Donation */}
          <button
            onClick={onOpenAddDonation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline">Register Surplus Food</span>
            <span className="xs:hidden">List Food</span>
          </button>
        </div>
      </div>

      {/* Global Auth & Profile Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
};

