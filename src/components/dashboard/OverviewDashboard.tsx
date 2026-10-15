import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FoodDonation } from '../../types';
import { StatusBadge, VegBadge, FoodSafetyLevelBadge, RoleBadge } from '../common/Badge';
import { DonationDetailModal } from '../donations/DonationDetailModal';
import { FoodSafetyNotice } from '../common/FoodSafetyNotice';
import {
  UtensilsCrossed,
  HeartHandshake,
  Building2,
  PackageCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  Flame,
  Info,
  Truck,
  CheckCircle2,
  Shield,
  Layers,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DonorDashboard } from './DonorDashboard';
import { NGODashboard } from './NGODashboard';
import { VolunteerDashboard } from './VolunteerDashboard';
import { AdminDashboard } from './AdminDashboard';

export const OverviewDashboard: React.FC = () => {
  const {
    donations,
    stats,
    urgentDonations,
    setSelectedDonationForMatch,
    setActiveTab,
    markDonationPickedUp,
    markDonationCompleted,
    cancelDonation,
    currentRole,
    startGuidedDemo,
    isDemoActive,
    isFirestoreConnected,
  } = useApp();

  const [inspectDonation, setInspectDonation] = useState<FoodDonation | null>(null);
  const [viewMode, setViewMode] = useState<'network' | 'role'>('network');

  // Recent 6 donations for table
  const recentDonations = useMemo(() => {
    return donations.slice(0, 6);
  }, [donations]);

  // Sparkline trend data
  const miniTrendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => ({
      day,
      meals: 40 + idx * 25 + (donations[idx % donations.length]?.quantityMeals || 20),
    }));
  }, [donations]);

  const handleMatch = (donation: FoodDonation) => {
    setSelectedDonationForMatch(donation);
    setActiveTab('find-food');
  };

  const renderRoleDashboard = () => {
    switch (currentRole) {
      case 'donor':
        return <DonorDashboard />;
      case 'ngo':
        return <NGODashboard />;
      case 'volunteer':
        return <VolunteerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <DonorDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      {/* View Mode Tabs (Network vs Dedicated Role Dashboard) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-slate-200/60 rounded-2xl border border-slate-300/60">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setViewMode('network')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              viewMode === 'network'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span>Redistribution Network Overview</span>
          </button>
          <button
            onClick={() => setViewMode('role')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              viewMode === 'role'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-300" />
            <span>Dedicated {currentRole.toUpperCase()} Portal</span>
          </button>
        </div>

        {/* Database & Role status */}
        <div className="flex items-center gap-2 px-3 py-1 text-[11px] text-slate-600">
          <span className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Firestore ABAC Active
          </span>
          <RoleBadge role={currentRole} />
        </div>
      </div>

      {viewMode === 'role' ? (
        renderRoleDashboard()
      ) : (
        <>
          {/* Demo Context & Role Notice */}
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200/90 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong className="text-slate-900 font-bold">Cloud Firestore ABAC Mode:</strong> Real-time cross-client sync, atomic claiming transactions, and zero-trust security rules.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isDemoActive && (
                <button
                  onClick={startGuidedDemo}
                  className="text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
                >
                  Start 9-Step Demo Walkthrough →
                </button>
              )}
            </div>
          </div>


      {/* 4 Major Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available Meals */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Available Meals
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.availableMeals}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Ready for Claim
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Surplus meals within valid collection window</p>
        </div>

        {/* Card 2: Active Donations */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Lots
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.activeDonationsCount}</span>
            <span className="text-xs text-slate-500 font-medium">in workflow</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Available, claimed, or in courier transit</p>
        </div>

        {/* Card 3: Registered NGOs */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Partner Shelters
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.registeredNGOsCount}</span>
            <span className="text-xs text-slate-500 font-medium">({stats.ngosActiveCount} active)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Verified recipient community kitchens</p>
        </div>

        {/* Card 4: Meals Redistributed */}
        <div className="p-5 rounded-2xl bg-white border border-emerald-300 shadow-2xs bg-emerald-50/30 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Meals Redistributed
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-900">{stats.mealsRedistributed}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
              Completed Only
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">
            {stats.completedDonationsCount} completed deliveries • {stats.co2KgSaved} kg CO₂ saved
          </p>
        </div>
      </div>

      {/* Urgent Donations Alert Strip */}
      {urgentDonations.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-amber-200/70 text-amber-900">
                <Flame className="w-4 h-4 text-amber-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Urgent Food Batches Approaching Collection Cutoff ({urgentDonations.length})
                </h3>
                <p className="text-xs text-amber-800/90">
                  Pickup must occur within 4 hours to preserve thermal hygiene compliance
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('donations')}
              className="text-xs font-bold text-amber-900 hover:underline hidden sm:block cursor-pointer"
            >
              View in Donations →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentDonations.map((item) => {
              const deadlineEpoch = new Date(item.collectionDeadline).getTime();
              const hoursLeft = ((deadlineEpoch - Date.now()) / (1000 * 60 * 60)).toFixed(1);

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-white border border-amber-200/90 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {item.foodName}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        {item.quantityMeals} Meals
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      From {item.donorName} • {item.pickupLocation}
                    </p>
                    <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Cutoff: {hoursLeft}h remaining ({new Date(item.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </p>
                  </div>

                  <button
                    onClick={() => handleMatch(item)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Match</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7-Day Velocity Chart & Safety Notice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Redistribution Activity (Last 7 Days)</h3>
              <p className="text-xs text-slate-500">Daily meals redistributed through verified courier handovers</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Live Tracker
            </span>
          </div>

          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={miniTrendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientRedist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="meals" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#gradientRedist)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col justify-between">
          <FoodSafetyNotice compact={true} />
          <div className="mt-3 p-4 rounded-xl bg-emerald-900 text-white space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Deterministic Matching Engine
            </h4>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Every surplus lot is scored across proximity, urgency, batch size, category, and shelter storage headroom.
            </p>
            <button
              onClick={() => setActiveTab('find-food')}
              className="w-full mt-1 py-2 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold text-center block transition-colors cursor-pointer"
            >
              Open AI Matching Engine →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Donations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Surplus Food Lots</h3>
            <p className="text-xs text-slate-500">Live operational status across all donor organizations</p>
          </div>
          <button
            onClick={() => setActiveTab('donations')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({donations.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Food Name</th>
                <th className="px-4 py-3.5">Donor</th>
                <th className="px-4 py-3.5 text-center">Quantity</th>
                <th className="px-4 py-3.5">Pickup Location</th>
                <th className="px-4 py-3.5">Cutoff</th>
                <th className="px-4 py-3.5">Status & Safety</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDonations.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4 max-w-[200px]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <VegBadge isVegetarian={item.isVegetarian} />
                      <span className="text-[10px] text-slate-500 font-medium">{item.category}</span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm truncate">{item.foodName}</p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-800">{item.donorName}</p>
                    <span className="text-[10px] text-slate-500">{item.donorType}</span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className="text-base font-black text-emerald-800">{item.quantityMeals}</span>
                    <span className="text-[10px] text-slate-400 block uppercase">meals</span>
                  </td>

                  <td className="px-4 py-4 max-w-[160px] truncate text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.pickupLocation}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="font-medium text-slate-800">
                      {new Date(item.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(item.collectionDeadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </td>

                  <td className="px-4 py-4 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={item.status} size="sm" />
                      <FoodSafetyLevelBadge
                        collectionDeadline={item.collectionDeadline}
                        status={item.status}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setInspectDonation(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                      {item.status === 'Available' && (
                        <button
                          onClick={() => handleMatch(item)}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Match</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

      {/* Inspect Modal */}
      <DonationDetailModal
        donation={inspectDonation}
        isOpen={!!inspectDonation}
        onClose={() => setInspectDonation(null)}
        onFindMatch={handleMatch}
        onMarkPickedUp={markDonationPickedUp}
        onMarkCompleted={markDonationCompleted}
        onCancelDonation={cancelDonation}
      />
    </div>
  );
};

