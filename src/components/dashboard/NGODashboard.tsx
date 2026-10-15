import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FoodDonation, NGO } from '../../types';
import { StatusBadge, VegBadge, UrgencyBadge } from '../common/Badge';
import { ClaimDonationModal } from '../matching/ClaimDonationModal';
import { DonationDetailModal } from '../donations/DonationDetailModal';
import {
  Building2,
  PackageCheck,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Truck,
  HeartHandshake,
} from 'lucide-react';

export const NGODashboard: React.FC = () => {
  const {
    donations,
    ngos,
    claimDonation,
    markDonationCompleted,
    getNGORemainingCapacity,
    getNGOCommittedMeals,
  } = useApp();

  // Pick first available NGO as demo perspective or allow picking
  const [selectedNgoId, setSelectedNgoId] = useState<string>(ngos[0]?.id || '');
  const activeNgo = ngos.find((n) => n.id === selectedNgoId) || ngos[0];

  const [claimDonationTarget, setClaimDonationTarget] = useState<FoodDonation | null>(null);
  const [inspectDonation, setInspectDonation] = useState<FoodDonation | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Compute live capacity
  const committedMeals = activeNgo ? getNGOCommittedMeals(activeNgo.id) : 0;
  const remainingCapacity = activeNgo ? getNGORemainingCapacity(activeNgo.id) : 0;
  const maxCapacity = activeNgo ? activeNgo.maxReceivingCapacity : 200;
  const capacityUsedPercent = Math.min(100, Math.round((committedMeals / maxCapacity) * 100));

  // Available donations eligible for intake
  const eligibleDonations = useMemo(() => {
    return donations.filter((d) => {
      if (d.status !== 'Available') return false;
      // Filter out non-veg if NGO does not accept it
      if (activeNgo && !activeNgo.acceptsNonVeg && !d.isVegetarian) return false;
      return true;
    });
  }, [donations, activeNgo]);

  // Donations claimed by this NGO in progress
  const incomingDeliveries = useMemo(() => {
    if (!activeNgo) return [];
    return donations.filter(
      (d) =>
        d.claimedByNgoId === activeNgo.id &&
        (d.status === 'Claimed' || d.status === 'Picked Up')
    );
  }, [donations, activeNgo]);

  // Completed history for this NGO
  const completedHistory = useMemo(() => {
    if (!activeNgo) return [];
    return donations.filter(
      (d) => d.claimedByNgoId === activeNgo.id && d.status === 'Completed'
    );
  }, [donations, activeNgo]);

  const handleConfirmDelivery = (donationId: string) => {
    setCompletingId(donationId);
    markDonationCompleted(
      donationId,
      activeNgo?.contactPerson || 'NGO Coordinator',
      'Food received in verified sanitary insulated conditions at shelter intake.'
    );
    setTimeout(() => setCompletingId(null), 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-semibold text-teal-100 mb-3">
              <Building2 className="w-3.5 h-3.5 text-teal-300" />
              <span>NGO Partner Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeNgo ? activeNgo.name : 'NGO Receiving Command'}
            </h2>
            <p className="text-teal-100/90 text-sm mt-1 max-w-xl">
              Monitor active receiving capacity, claim compatible surplus lots with backend race-condition protection, and confirm meal delivery handovers.
            </p>
          </div>

          {/* Switch NGO selector */}
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 w-full sm:w-auto">
            <label className="text-[11px] text-teal-200 uppercase font-bold block mb-1">
              Active Shelter Entity:
            </label>
            <select
              value={selectedNgoId}
              onChange={(e) => setSelectedNgoId(e.target.value)}
              className="bg-teal-950/80 text-white text-xs font-semibold px-3 py-2 rounded-lg border border-teal-700/60 focus:outline-hidden w-full cursor-pointer"
            >
              {ngos.map((ngo) => (
                <option key={ngo.id} value={ngo.id}>
                  {ngo.name} ({ngo.location})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Capacity Meter */}
        <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 p-4 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-teal-200">Current Intake Capacity</span>
              <span className="font-bold">{committedMeals} / {maxCapacity} meals</span>
            </div>
            <div className="w-full bg-teal-950 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  capacityUsedPercent > 85 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${capacityUsedPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-teal-200 mt-2">
              <strong className="text-white">{remainingCapacity} meals</strong> safe headroom remaining
            </p>
          </div>

          <div className="bg-white/10 p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-teal-200">Incoming Deliveries</p>
              <p className="text-2xl font-black mt-1">{incomingDeliveries.length}</p>
            </div>
            <Truck className="w-8 h-8 text-teal-300 opacity-80" />
          </div>

          <div className="bg-white/10 p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-teal-200">Total Meals Received</p>
              <p className="text-2xl font-black mt-1">
                {completedHistory.reduce((s, c) => s + c.quantityMeals, 0)}
              </p>
            </div>
            <HeartHandshake className="w-8 h-8 text-teal-300 opacity-80" />
          </div>
        </div>
      </div>

      {/* Incoming Deliveries in Progress */}
      {incomingDeliveries.length > 0 && (
        <div className="bg-amber-50/80 rounded-2xl border border-amber-200 p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-5 h-5 text-amber-700 animate-pulse" />
            <h3 className="font-bold text-slate-900">
              Incoming Couriers / En Route Deliveries ({incomingDeliveries.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {incomingDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="bg-white p-4 rounded-xl border border-amber-200/90 shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{delivery.foodName}</h4>
                    <p className="text-xs text-slate-500">
                      Donor: <strong className="text-slate-800">{delivery.donorName}</strong>
                    </p>
                  </div>
                  <StatusBadge status={delivery.status} />
                </div>
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                  <p>
                    <strong>Servings:</strong> {delivery.quantityMeals} meals
                  </p>
                  <p>
                    <strong>Courier:</strong> {delivery.assignedVolunteerName || 'En route / awaiting volunteer'}
                  </p>
                </div>
                <button
                  disabled={completingId === delivery.id}
                  onClick={() => handleConfirmDelivery(delivery.id)}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {completingId === delivery.id ? 'Verifying Receipt...' : 'Confirm Receipt of Delivery'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Eligible Donations for Intake */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900">
              Available Compatible Donations ({eligibleDonations.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Matches dietary prefs for {activeNgo?.name}
          </span>
        </div>

        {eligibleDonations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No compatible donations currently waiting. New surplus batches will appear here in real time.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {eligibleDonations.map((donation) => {
              const exceedsCap = donation.quantityMeals > remainingCapacity;

              return (
                <div
                  key={donation.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{donation.foodName}</span>
                      <StatusBadge status={donation.status} />
                      <VegBadge isVegetarian={donation.isVegetarian} />
                      <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
                        {donation.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {donation.quantityMeals} Servings
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {donation.pickupLocation}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Storage: {donation.storageRequirement}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setInspectDonation(donation)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      Inspect Specs
                    </button>
                    <button
                      disabled={exceedsCap}
                      onClick={() => setClaimDonationTarget(donation)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                        exceedsCap
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      }`}
                      title={exceedsCap ? 'Batch exceeds current remaining intake capacity' : 'Claim this donation'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{exceedsCap ? 'Capacity Exceeded' : 'Claim for Shelter'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Claim Modal with Atomic Transaction */}
      {claimDonationTarget && activeNgo && (
        <ClaimDonationModal
          donation={claimDonationTarget}
          ngo={activeNgo}
          matchScore={92}
          remainingCapacity={remainingCapacity}
          committedMeals={committedMeals}
          isOpen={!!claimDonationTarget}
          onClose={() => setClaimDonationTarget(null)}
          onConfirmClaim={() => {
            claimDonation(claimDonationTarget.id, activeNgo.id, activeNgo.name);
            setClaimDonationTarget(null);
          }}
        />
      )}

      {/* Detail Modal */}
      {inspectDonation && (
        <DonationDetailModal
          donation={inspectDonation}
          isOpen={!!inspectDonation}
          onClose={() => setInspectDonation(null)}
        />
      )}
    </div>
  );
};
