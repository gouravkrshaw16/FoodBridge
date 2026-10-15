import React, { useState } from 'react';
import { FoodDonation, NGO } from '../../types';
import { Modal } from '../common/Modal';
import { VegBadge, UrgencyBadge } from '../common/Badge';
import {
  HeartHandshake,
  ShieldCheck,
  AlertTriangle,
  Building,
  MapPin,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ClaimDonationModalProps {
  donation: FoodDonation | null;
  ngo: NGO | null;
  matchScore: number;
  remainingCapacity: number;
  committedMeals: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirmClaim: (donationId: string, ngoId: string, ngoName: string) => void;
}

export const ClaimDonationModal: React.FC<ClaimDonationModalProps> = ({
  donation,
  ngo,
  matchScore,
  remainingCapacity,
  committedMeals,
  isOpen,
  onClose,
  onConfirmClaim,
}) => {
  const [safetyCheckConfirmed, setSafetyCheckConfirmed] = useState(false);

  if (!donation || !ngo) return null;

  const capacityAfterClaim = remainingCapacity - donation.quantityMeals;
  const isCapacityValid = capacityAfterClaim >= 0;

  const handleClaim = () => {
    if (!safetyCheckConfirmed || !isCapacityValid) return;
    onConfirmClaim(donation.id, ngo.id, ngo.name);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm NGO Food Lot Allocation"
      subtitle="Connect verified surplus batch with recipient shelter kitchen"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Match Header */}
        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-700" />
            <div>
              <p className="font-bold text-emerald-950 text-sm">Optimal AI Compatibility Match</p>
              <p className="text-emerald-800">Scored {matchScore}/100 across 5 verified criteria</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-700 text-white font-extrabold text-sm shadow-xs">
            {matchScore}%
          </span>
        </div>

        {/* Pairing Visual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Donation Box */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Donor Lot
            </span>
            <p className="font-bold text-slate-900 text-sm line-clamp-1">{donation.foodName}</p>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-emerald-800 text-base">{donation.quantityMeals}</span>
              <span className="text-slate-500 font-semibold">Meals ({donation.category})</span>
            </div>
            <p className="text-slate-500 truncate">{donation.donorName}</p>
          </div>

          {/* NGO Box */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Recipient Organization
            </span>
            <p className="font-bold text-slate-900 text-sm line-clamp-1">{ngo.name}</p>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-800 text-base">{ngo.mealsRequired}</span>
              <span className="text-slate-500 font-semibold">Daily Demand Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UrgencyBadge urgency={ngo.urgency} />
              <span className="text-slate-500 font-mono text-[11px]">{ngo.simulatedDistanceKm.toFixed(1)} km simulated</span>
            </div>
          </div>
        </div>

        {/* Real Capacity Balance Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-slate-800 font-bold">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-700" />
              NGO Intake Capacity Balance Check
            </span>
            <span className="font-mono text-emerald-800">{remainingCapacity} meals currently free</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Peak Ceiling</span>
              <span className="font-black text-slate-800 text-sm">{ngo.maxReceivingCapacity}</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">In Transit Commitments</span>
              <span className="font-black text-amber-700 text-sm">{committedMeals}</span>
            </div>
            <div className={`p-2 rounded-lg border ${
              isCapacityValid ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Headroom After Claim</span>
              <span className={`font-black text-sm ${isCapacityValid ? 'text-emerald-800' : 'text-rose-700'}`}>
                {capacityAfterClaim} meals
              </span>
            </div>
          </div>
        </div>

        {/* Mandatory Safety Checkbox */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="safetyCheck"
              checked={safetyCheckConfirmed}
              onChange={(e) => setSafetyCheckConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-amber-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="safetyCheck" className="text-slate-700 cursor-pointer">
              <span className="font-bold text-slate-900 block mb-0.5">
                Recipient Food Safety & Temperature Acknowledgment
              </span>
              I certify that this shelter kitchen can inspect, safely store at specified temperature ({donation.temperatureRequirement || donation.storageRequirement}), and distribute this surplus batch to verified beneficiaries today.
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!safetyCheckConfirmed || !isCapacityValid}
            onClick={handleClaim}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
              safetyCheckConfirmed && isCapacityValid
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Confirm Allocation</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
