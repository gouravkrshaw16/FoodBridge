import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FoodDonation, Volunteer } from '../../types';
import { StatusBadge, VegBadge, VolunteerStatusBadge } from '../common/Badge';
import { DonationDetailModal } from '../donations/DonationDetailModal';
import {
  Bike,
  Truck,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Package,
  AlertCircle,
  Thermometer,
  ShieldCheck,
  Navigation,
  History,
} from 'lucide-react';

export const VolunteerDashboard: React.FC = () => {
  const {
    donations,
    volunteers,
    markDonationPickedUp,
    markDonationCompleted,
    updateVolunteerStatus,
  } = useApp();

  const [selectedVolId, setSelectedVolId] = useState<string>(volunteers[0]?.id || '');
  const activeVolunteer = volunteers.find((v) => v.id === selectedVolId) || volunteers[0];
  const [inspectDonation, setInspectDonation] = useState<FoodDonation | null>(null);

  // My current active deliveries
  const myAssignedDonations = useMemo(() => {
    if (!activeVolunteer) return [];
    return donations.filter(
      (d) =>
        d.assignedVolunteerId === activeVolunteer.id &&
        (d.status === 'Claimed' || d.status === 'Picked Up')
    );
  }, [donations, activeVolunteer]);

  // Delivery History
  const myDeliveryHistory = useMemo(() => {
    if (!activeVolunteer) return [];
    return donations.filter(
      (d) =>
        d.assignedVolunteerId === activeVolunteer.id &&
        d.status === 'Completed'
    );
  }, [donations, activeVolunteer]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-semibold text-blue-100 mb-3">
              <Bike className="w-3.5 h-3.5 text-blue-300" />
              <span>Courier Dispatch Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeVolunteer ? activeVolunteer.name : 'Volunteer Courier'}
            </h2>
            <p className="text-blue-100/90 text-sm mt-1 max-w-xl">
              Execute insulated food pickups, maintain temperature log sheets, and record official recipient handovers.
            </p>
          </div>

          {/* Courier Selector & Status */}
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20 w-full sm:w-auto space-y-2">
            <div>
              <label className="text-[11px] text-blue-200 uppercase font-bold block mb-1">
                Active Courier Identity:
              </label>
              <select
                value={selectedVolId}
                onChange={(e) => setSelectedVolId(e.target.value)}
                className="bg-blue-950/90 text-white text-xs font-semibold px-3 py-2 rounded-lg border border-blue-700/60 focus:outline-hidden w-full cursor-pointer"
              >
                {volunteers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.vehicleType} • {v.serviceArea})
                  </option>
                ))}
              </select>
            </div>

            {activeVolunteer && (
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <span className="text-blue-200">Duty Status:</span>
                <button
                  onClick={() =>
                    updateVolunteerStatus(
                      activeVolunteer.id,
                      activeVolunteer.status === 'Available' ? 'Off Duty' : 'Available'
                    )
                  }
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                >
                  {activeVolunteer.status} (Toggle)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Courier metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20">
          <div>
            <p className="text-xs text-blue-200">Vehicle Type</p>
            <p className="text-lg font-bold">{activeVolunteer?.vehicleType || 'Motorbike'}</p>
          </div>
          <div>
            <p className="text-xs text-blue-200">Service Area</p>
            <p className="text-lg font-bold">{activeVolunteer?.serviceArea || 'Metro'}</p>
          </div>
          <div>
            <p className="text-xs text-blue-200">Active Routes</p>
            <p className="text-2xl font-black">{myAssignedDonations.length}</p>
          </div>
          <div>
            <p className="text-xs text-blue-200">Lifetime Deliveries</p>
            <p className="text-2xl font-black">
              {activeVolunteer?.completedDeliveriesCount || myDeliveryHistory.length}
            </p>
          </div>
        </div>
      </div>

      {/* Assigned Deliveries Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-slate-900">
              Assigned Pickups & Active Dispatches ({myAssignedDonations.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">Live courier tasks</span>
        </div>

        {myAssignedDonations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <p>You have no active deliveries assigned right now.</p>
            <p className="text-xs text-slate-400 mt-1">
              When an NGO or admin dispatches you for a pickup, it will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myAssignedDonations.map((d) => (
              <div key={d.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-base">{d.foodName}</span>
                      <StatusBadge status={d.status} />
                      <VegBadge isVegetarian={d.isVegetarian} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Donor: <strong className="text-slate-800">{d.donorName}</strong> • Destination:{' '}
                      <strong className="text-emerald-700">{d.claimedByNgoName || 'NGO Partner'}</strong>
                    </p>
                  </div>

                  <span className="text-xs font-bold bg-blue-50 text-blue-800 px-3 py-1.5 rounded-xl border border-blue-200">
                    {d.quantityMeals} Servings ({d.quantity} {d.quantityUnit})
                  </span>
                </div>

                {/* Routing & Thermal Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Pickup:</strong> {d.pickupLocation}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        <strong>Contact Donor:</strong> {d.donorContact}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Thermometer className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        <strong>Storage Requirement:</strong> {d.storageRequirement}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        <strong>Collection Deadline:</strong>{' '}
                        {new Date(d.collectionDeadline).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Courier Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setInspectDonation(d)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                  >
                    View Full Dispatch Sheet
                  </button>

                  <div className="flex items-center gap-2">
                    {d.status === 'Claimed' && (
                      <button
                        onClick={() =>
                          markDonationPickedUp(
                            d.id,
                            `${activeVolunteer?.name || 'Courier'} (${activeVolunteer?.vehicleType || 'Two-Wheeler'})`
                          )
                        }
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Package className="w-4 h-4" />
                        <span>Confirm Food Pickup at Donor</span>
                      </button>
                    )}

                    {d.status === 'Picked Up' && (
                      <button
                        onClick={() =>
                          markDonationCompleted(
                            d.id,
                            `${activeVolunteer?.name || 'Courier'}`,
                            'Transit completed within safe temperature limits.'
                          )
                        }
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Delivery at NGO Shelter</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Volunteer Assignment History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-blue-700" />
          <h3 className="font-bold text-slate-900">Delivered Mission Log</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Batch</th>
                <th className="py-2.5 px-3">Servings</th>
                <th className="py-2.5 px-3">Origin Donor</th>
                <th className="py-2.5 px-3">Destination NGO</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myDeliveryHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    No past deliveries on record for this volunteer.
                  </td>
                </tr>
              ) : (
                myDeliveryHistory.map((h) => (
                  <tr key={h.id}>
                    <td className="py-3 px-3 font-semibold text-slate-800">{h.foodName}</td>
                    <td className="py-3 px-3">{h.quantityMeals} meals</td>
                    <td className="py-3 px-3 text-slate-600">{h.donorName}</td>
                    <td className="py-3 px-3 text-emerald-700 font-medium">{h.claimedByNgoName || 'Verified Partner'}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={h.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
