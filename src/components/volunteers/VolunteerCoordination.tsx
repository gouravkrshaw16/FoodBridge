import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Volunteer, FoodDonation } from '../../types';
import { VolunteerStatusBadge, StatusBadge, FoodSafetyLevelBadge } from '../common/Badge';
import { RegisterVolunteerModal } from './RegisterVolunteerModal';
import { AssignVolunteerModal } from './AssignVolunteerModal';
import {
  Bike,
  PlusCircle,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  AlertCircle,
  Package,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export const VolunteerCoordination: React.FC = () => {
  const {
    volunteers,
    donations,
    addVolunteer,
    updateVolunteerStatus,
    assignVolunteer,
    markDonationPickedUp,
    markDonationCompleted,
    cancelDonation,
    currentRole,
  } = useApp();

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedDonationForAssignment, setSelectedDonationForAssignment] = useState<FoodDonation | null>(null);

  // Active dispatches: Claimed (needs courier or assigned) and Picked Up (in transit)
  const activeDispatches = donations.filter((d) =>
    ['Claimed', 'Picked Up'].includes(d.status)
  );

  return (
    <div className="space-y-6">
      {/* Active Delivery Missions Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-700" />
              <span>Active Courier Runs & Pickup Dispatches</span>
            </h2>
            <p className="text-xs text-slate-500">
              Live transit tracking of claimed surplus food lots awaiting or undergoing transit to NGO kitchens
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold shrink-0">
            {activeDispatches.length} Active Run{activeDispatches.length !== 1 ? 's' : ''}
          </span>
        </div>

        {activeDispatches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No Pending Courier Deliveries</p>
            <p className="mt-0.5">When an NGO claims an available food donation, it will appear here for courier dispatch.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeDispatches.map((item) => {
              const deadlineEpoch = new Date(item.collectionDeadline).getTime();
              const isUrgent = deadlineEpoch - Date.now() <= 2 * 60 * 60 * 1000;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={item.status} size="sm" />
                      <FoodSafetyLevelBadge
                        collectionDeadline={item.collectionDeadline}
                        status={item.status}
                      />
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {item.quantityMeals} Meals ({item.category})
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Lot #{item.id}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{item.foodName}</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
                      <div className="flex items-start gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Pickup Point:</span>
                          <span className="font-semibold text-slate-800">{item.donorName}</span>
                          <span className="text-slate-500 block text-[11px] truncate">{item.pickupLocation}</span>
                          <span className="text-slate-500 block text-[11px] mt-0.5 font-mono">{item.donorContact}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <Truck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Delivery Shelter:</span>
                          <span className="font-semibold text-slate-800">{item.claimedByNgoName || 'Shelter'}</span>
                          <span className="text-emerald-800 font-bold block text-[11px] mt-0.5">
                            Assigned Courier: {item.assignedVolunteerName || '⚠️ Needs Courier Dispatch'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Action Controls */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                    {!item.assignedVolunteerId ? (
                      <button
                        onClick={() => setSelectedDonationForAssignment(item)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Bike className="w-3.5 h-3.5" />
                        <span>Assign Courier</span>
                      </button>
                    ) : item.status === 'Claimed' ? (
                      <button
                        onClick={() =>
                          markDonationPickedUp(
                            item.id,
                            `${item.assignedVolunteerName} (Volunteer Courier)`
                          )
                        }
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Confirm Picked Up</span>
                      </button>
                    ) : item.status === 'Picked Up' ? (
                      <button
                        onClick={() =>
                          markDonationCompleted(
                            item.id,
                            `${item.claimedByNgoName} Coordinator`,
                            'Sensory inspection passed, received in good condition.'
                          )
                        }
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Handover & Deliver</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Volunteer Fleet Directory */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bike className="w-5 h-5 text-emerald-700" />
              <span>Registered Volunteer Fleet ({volunteers.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Active couriers, vehicle logistics, and delivery fulfillment histories
            </p>
          </div>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Register Volunteer</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
          {volunteers.map((vol) => (
            <div
              key={vol.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-sm shadow-2xs">
                    {vol.name.slice(0, 2).toUpperCase()}
                  </div>
                  <VolunteerStatusBadge status={vol.status} />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{vol.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{vol.vehicleType}</p>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  <p className="flex items-center gap-1.5 text-[11px]">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{vol.serviceArea}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px]">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{vol.contactPhone}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Completed</span>
                  <span className="font-extrabold text-emerald-800">{vol.completedDeliveriesCount} trips</span>
                </div>

                {vol.status !== 'On Delivery' && (
                  <button
                    onClick={() =>
                      updateVolunteerStatus(
                        vol.id,
                        vol.status === 'Available' ? 'Off Duty' : 'Available'
                      )
                    }
                    className="text-[10px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                  >
                    Set {vol.status === 'Available' ? 'Off Duty' : 'Available'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Register Volunteer Modal */}
      <RegisterVolunteerModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSubmit={addVolunteer}
      />

      {/* Assign Volunteer Modal */}
      <AssignVolunteerModal
        isOpen={!!selectedDonationForAssignment}
        onClose={() => setSelectedDonationForAssignment(null)}
        donation={selectedDonationForAssignment}
        volunteers={volunteers}
        onAssign={assignVolunteer}
      />
    </div>
  );
};
