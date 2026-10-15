import React, { useState } from 'react';
import { FoodDonation } from '../../types';
import { Modal } from '../common/Modal';
import { StatusBadge, VegBadge, FoodSafetyLevelBadge } from '../common/Badge';
import {
  Clock,
  MapPin,
  Phone,
  Building,
  Thermometer,
  ShieldAlert,
  Calendar,
  Sparkles,
  Truck,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  History,
  Ban,
  FileText,
} from 'lucide-react';

interface DonationDetailModalProps {
  donation: FoodDonation | null;
  isOpen: boolean;
  onClose: () => void;
  onFindMatch?: (donation: FoodDonation) => void;
  onMarkPickedUp?: (id: string) => void;
  onMarkCompleted?: (id: string) => void;
  onCancelDonation?: (id: string, reason: string) => void;
}

export const DonationDetailModal: React.FC<DonationDetailModalProps> = ({
  donation,
  isOpen,
  onClose,
  onFindMatch,
  onMarkPickedUp,
  onMarkCompleted,
  onCancelDonation,
}) => {
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!donation) return null;

  const deadlineEpoch = new Date(donation.collectionDeadline).getTime();
  const isExpired = deadlineEpoch <= Date.now() || donation.status === 'Expired';
  const hoursLeft = ((deadlineEpoch - Date.now()) / (1000 * 60 * 60)).toFixed(1);

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) return;
    if (onCancelDonation) {
      onCancelDonation(donation.id, cancelReason.trim());
    }
    setShowCancelPrompt(false);
    setCancelReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Surplus Food Batch Inspection & Audit Trail"
      subtitle={`Lot ID: ${donation.id} • Registered ${new Date(donation.createdAt).toLocaleString()}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Header Summary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusBadge status={donation.status} />
              <FoodSafetyLevelBadge
                collectionDeadline={donation.collectionDeadline}
                status={donation.status}
              />
              <VegBadge isVegetarian={donation.isVegetarian} />
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-800 font-semibold">
                {donation.category}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">{donation.foodName}</h2>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4 shrink-0">
            <span className="text-2xl font-black text-emerald-800">{donation.quantityMeals}</span>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Estimated Meals ({donation.quantity} {donation.quantityUnit})
            </span>
          </div>
        </div>

        {/* Safety & Time Window Banner */}
        <div className="p-3.5 rounded-xl border bg-white flex items-start gap-3 shadow-2xs">
          <Clock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Collection Deadline Window:</span>
              <span className="font-mono text-emerald-800 font-bold">
                {new Date(donation.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' '}({new Date(donation.collectionDeadline).toLocaleDateString([], { month: 'short', day: 'numeric' })})
              </span>
            </div>
            <p className="text-slate-600">
              {isExpired ? (
                <span className="text-rose-600 font-bold">
                  Collection window lapsed. Safe holding period exceeded.
                </span>
              ) : (
                <span>
                  Approximately <strong>{hoursLeft} hours</strong> remaining for courier pickup and handover.
                </span>
              )}
            </p>
            <p className="text-[11px] text-slate-500">
              Prepared on {new Date(donation.preparationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Thermal spec: {donation.temperatureRequirement || donation.storageRequirement}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Building className="w-4 h-4 text-emerald-700" />
              <span>Donor Institution</span>
            </div>
            <p className="font-semibold text-slate-800">{donation.donorName}</p>
            <p className="text-slate-500">{donation.donorType}</p>
            <p className="text-slate-600 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{donation.donorContact}</span>
            </p>
            <p className="text-slate-600 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{donation.pickupLocation}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Thermometer className="w-4 h-4 text-emerald-700" />
              <span>Thermal & Dietary Standards</span>
            </div>
            <p>
              <span className="text-slate-500 block">Storage Category:</span>
              <span className="font-semibold text-slate-800">{donation.storageRequirement}</span>
            </p>
            <p>
              <span className="text-slate-500 block">Declared Allergens:</span>
              <span className="font-semibold text-slate-800">{donation.allergens || 'None reported'}</span>
            </p>
            {donation.specialHandlingInstructions && (
              <p>
                <span className="text-slate-500 block">Handling:</span>
                <span className="font-semibold text-slate-700">{donation.specialHandlingInstructions}</span>
              </p>
            )}
          </div>
        </div>

        {/* Allocation Info if Claimed */}
        {(donation.claimedByNgoName || donation.assignedVolunteerName) && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <HeartHandshake className="w-4 h-4 text-emerald-700" />
              Redistribution Assignment
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {donation.claimedByNgoName && (
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Reserved For:</span>
                  <span className="font-bold text-slate-800">{donation.claimedByNgoName}</span>
                </div>
              )}
              {donation.assignedVolunteerName && (
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Assigned Courier:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-emerald-700" />
                    {donation.assignedVolunteerName}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audit History Log */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-700" />
              Immutable Lifecycle Audit Trail ({donation.statusHistory?.length || 1})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Verified Records</span>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {(donation.statusHistory || []).map((entry, idx) => (
              <div
                key={entry.id || idx}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={entry.status} size="sm" />
                    <span className="font-semibold text-slate-800">{entry.actor}</span>
                  </div>
                  {entry.notes && (
                    <p className="text-[11px] text-slate-600 italic pl-1">{entry.notes}</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cancellation Sub-Form if prompted */}
        {showCancelPrompt && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-950 font-bold">
              <Ban className="w-4 h-4 text-rose-600" />
              <span>Cancel Food Batch</span>
            </div>
            <p className="text-rose-800 text-[11px]">
              Provide a valid operational cancellation reason (e.g. food damaged, donor closed early, weather disruption).
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Storage temperature failure before courier pickup."
              className="w-full px-3 py-2 rounded-lg border border-rose-300 text-xs bg-white"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCancelPrompt(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!cancelReason.trim()}
                onClick={handleConfirmCancel}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Close
            </button>

            {donation.status !== 'Completed' &&
              donation.status !== 'Cancelled' &&
              donation.status !== 'Expired' &&
              !showCancelPrompt && (
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(true)}
                  className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-medium cursor-pointer"
                >
                  Cancel Batch
                </button>
              )}
          </div>

          <div className="flex items-center gap-2">
            {donation.status === 'Available' && !isExpired && (
              <button
                type="button"
                onClick={() => {
                  if (onFindMatch) onFindMatch(donation);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Find Best NGO Match
              </button>
            )}

            {donation.status === 'Claimed' && (
              <button
                type="button"
                onClick={() => {
                  if (onMarkPickedUp) onMarkPickedUp(donation.id);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                Confirm Food Picked Up
              </button>
            )}

            {donation.status === 'Picked Up' && (
              <button
                type="button"
                onClick={() => {
                  if (onMarkCompleted) onMarkCompleted(donation.id);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Completed & Verified
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
