import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { NGO, FoodCategory } from '../../types';
import { UrgencyBadge } from '../common/Badge';
import { NGORegistrationModal } from './NGORegistrationModal';
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  Sliders,
  Utensils,
  Info,
  Clock,
  Layers,
  ShieldAlert,
} from 'lucide-react';

export const NGOPartners: React.FC = () => {
  const {
    ngos,
    addNGO,
    toggleNGOAvailability,
    updateNGOCapacity,
    toggleNGOVerification,
    getNGORemainingCapacity,
    getNGOCommittedMeals,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('All');
  const [verificationFilter, setVerificationFilter] = useState<string>('All');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Quick edit capacity state
  const [editingCapacityNgoId, setEditingCapacityNgoId] = useState<string | null>(null);
  const [newCapacityValue, setNewCapacityValue] = useState<number>(100);

  const filteredNgos = useMemo(() => {
    return ngos.filter((ngo) => {
      const matchesSearch =
        ngo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ngo.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ngo.serviceArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ngo.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesUrgency = urgencyFilter === 'All' || ngo.urgency === urgencyFilter;
      const matchesAvail =
        availabilityFilter === 'All' ||
        (availabilityFilter === 'Available' && ngo.isAvailable) ||
        (availabilityFilter === 'Unavailable' && !ngo.isAvailable);

      const matchesVerify =
        verificationFilter === 'All' ||
        (verificationFilter === 'Verified' && ngo.isVerified) ||
        (verificationFilter === 'Unverified' && !ngo.isVerified);

      return matchesSearch && matchesUrgency && matchesAvail && matchesVerify;
    });
  }, [ngos, searchQuery, urgencyFilter, availabilityFilter, verificationFilter]);

  const handleSaveCapacity = (ngoId: string) => {
    if (newCapacityValue > 0) {
      updateNGOCapacity(ngoId, newCapacityValue);
    }
    setEditingCapacityNgoId(null);
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-slate-100/90 border border-slate-200 text-xs text-slate-700 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-900 font-bold">Hackathon Demonstration Notice:</strong> The partner shelters below represent simulated demo community partner kitchens with realistic operational capacities and mock addresses for testing the food redistribution engine.
        </p>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search partner shelters by name, service district, or coordinator..."
              className="w-full pl-9.5 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Partner NGO</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filter Directory:
          </span>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Urgencies</option>
            <option value="Critical">Critical Urgency</option>
            <option value="High">High Urgency</option>
            <option value="Medium">Medium Urgency</option>
            <option value="Low">Low Urgency</option>
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Intake Statuses</option>
            <option value="Available">Available (Accepting Food)</option>
            <option value="Unavailable">Intake Paused</option>
          </select>

          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Verifications</option>
            <option value="Verified">Verified Shelters</option>
            <option value="Unverified">Pending Verification</option>
          </select>

          {(urgencyFilter !== 'All' ||
            availabilityFilter !== 'All' ||
            verificationFilter !== 'All' ||
            searchQuery) && (
            <button
              onClick={() => {
                setUrgencyFilter('All');
                setAvailabilityFilter('All');
                setVerificationFilter('All');
                setSearchQuery('');
              }}
              className="text-emerald-700 hover:text-emerald-900 font-semibold underline ml-auto text-xs cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* NGO Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNgos.map((ngo) => {
          const remaining = getNGORemainingCapacity(ngo.id);
          const committed = getNGOCommittedMeals(ngo.id);

          return (
            <div
              key={ngo.id}
              className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs flex flex-col justify-between ${
                ngo.isAvailable ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50/50 opacity-80'
              }`}
            >
              <div className="space-y-3">
                {/* Header Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <UrgencyBadge urgency={ngo.urgency} />
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {ngo.simulatedDistanceKm.toFixed(1)} km simulated
                    </span>
                    <button
                      onClick={() => toggleNGOVerification(ngo.id)}
                      title="Click to toggle verification status"
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-0.5 ${
                        ngo.isVerified
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                          : 'text-amber-800 bg-amber-50 border-amber-200'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {ngo.isVerified ? 'Verified Shelter' : 'Pending Verification'}
                    </button>
                  </div>

                  {/* Availability Toggle */}
                  <button
                    onClick={() => toggleNGOAvailability(ngo.id)}
                    title="Click to toggle intake readiness"
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                      ngo.isAvailable
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${ngo.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {ngo.isAvailable ? 'Accepting Food' : 'Intake Paused'}
                  </button>
                </div>

                {/* Title & Desc */}
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">{ngo.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 flex-wrap">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{ngo.location}</span>
                    <span>• District: {ngo.serviceArea}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Operating Hours: {ngo.operatingHours}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic">
                    "{ngo.beneficiaryDescription}"
                  </p>
                </div>

                {/* Real Capacity & Balance Box */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Daily Demand
                    </span>
                    <span className="text-base font-black text-slate-800">{ngo.mealsRequired}</span>
                    <span className="text-[10px] text-slate-500 block">meals/day</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      In Transit
                    </span>
                    <span className="text-base font-black text-amber-700">{committed}</span>
                    <span className="text-[10px] text-slate-500 block">committed</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Remaining Free
                    </span>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-base font-black text-emerald-800">{remaining}</span>
                      <button
                        onClick={() => {
                          setEditingCapacityNgoId(ngo.id);
                          setNewCapacityValue(ngo.maxReceivingCapacity);
                        }}
                        title="Edit storage ceiling"
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 block">of {ngo.maxReceivingCapacity} max</span>
                  </div>
                </div>

                {/* Capacity Edit Prompt if active */}
                {editingCapacityNgoId === ngo.id && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-emerald-950">Update Peak Intake Limit:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="20"
                        value={newCapacityValue}
                        onChange={(e) => setNewCapacityValue(Number(e.target.value))}
                        className="w-20 px-2 py-1 text-xs rounded border border-emerald-300 font-bold bg-white"
                      />
                      <button
                        onClick={() => handleSaveCapacity(ngo.id)}
                        className="px-2.5 py-1 bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Food Category Tags */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Accepted Categories & Dietary Standard
                  </span>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {ngo.acceptedCategories.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                      >
                        {c}
                      </span>
                    ))}
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold ${
                        ngo.acceptsNonVeg
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {ngo.acceptsNonVeg ? 'Accepts Non-Veg' : 'Strictly Pure Veg'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coordinator Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-700 truncate">
                  Contact: {ngo.contactPerson}
                </span>
                <span className="font-mono text-[11px] shrink-0">{ngo.contactPhone}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Modal */}
      <NGORegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSubmit={addNGO}
      />
    </div>
  );
};
