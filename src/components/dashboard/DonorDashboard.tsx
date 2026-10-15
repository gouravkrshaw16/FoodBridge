import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FoodDonation } from '../../types';
import { StatusBadge, VegBadge, UrgencyBadge } from '../common/Badge';
import { DonationDetailModal } from '../donations/DonationDetailModal';
import { DonationFormModal } from '../donations/DonationFormModal';
import {
  PlusCircle,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  PackageCheck,
  Truck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  History,
} from 'lucide-react';

export const DonorDashboard: React.FC = () => {
  const {
    donations,
    addDonation,
    setSelectedDonationForMatch,
    setActiveTab,
    currentRole,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<FoodDonation | null>(null);

  // Filter donations relevant to this donor perspective
  const myDonations = donations;
  const activeDonations = myDonations.filter(
    (d) => d.status === 'Available' || d.status === 'Claimed' || d.status === 'Picked Up'
  );
  const completedDonations = myDonations.filter((d) => d.status === 'Completed');
  const totalMealsContributed = myDonations.reduce((sum, d) => sum + (d.quantityMeals || 0), 0);

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-semibold text-emerald-100 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Donor Command Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Food Donor Management
            </h2>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
              List kitchen surplus, monitor real-time temperature compliance, track courier dispatch, and review redistribution history.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white text-emerald-900 rounded-xl font-bold text-sm shadow hover:bg-emerald-50 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-5 h-5 text-emerald-700" />
            <span>List Surplus Batch</span>
          </button>
        </div>

        {/* Quick KPI stats for Donor */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20">
          <div>
            <p className="text-xs text-emerald-200">Total Meals Donated</p>
            <p className="text-2xl font-black">{totalMealsContributed}</p>
          </div>
          <div>
            <p className="text-xs text-emerald-200">Active Listings</p>
            <p className="text-2xl font-black">{activeDonations.length}</p>
          </div>
          <div>
            <p className="text-xs text-emerald-200">Successfully Delivered</p>
            <p className="text-2xl font-black">{completedDonations.length}</p>
          </div>
          <div>
            <p className="text-xs text-emerald-200">CO₂ Avoided</p>
            <p className="text-2xl font-black">{(totalMealsContributed * 1.8).toFixed(0)} kg</p>
          </div>
        </div>
      </div>

      {/* Active Listings Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900">Active Surplus Batches ({activeDonations.length})</h3>
          </div>
          <span className="text-xs text-slate-500">Live synced with Cloud Firestore</span>
        </div>

        {activeDonations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">No active surplus batches right now.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              List new surplus food
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeDonations.map((donation) => {
              const deadline = new Date(donation.collectionDeadline).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

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
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {donation.quantityMeals} Meals ({donation.quantity} {donation.quantityUnit})
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {donation.pickupLocation}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Deadline: {deadline}
                      </span>
                    </div>

                    {/* Progress tracking for pickup & delivery */}
                    {donation.status !== 'Available' && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-emerald-600" />
                          <span>
                            Claimed by: <strong className="text-slate-900">{donation.claimedByNgoName || 'Verified NGO'}</strong>
                          </span>
                        </div>
                        {donation.assignedVolunteerName && (
                          <span className="text-slate-600">
                            Courier: <strong className="text-slate-900">{donation.assignedVolunteerName}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedDonation(donation)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      View Details & Audit
                    </button>
                    {donation.status === 'Available' && (
                      <button
                        onClick={() => {
                          setSelectedDonationForMatch(donation);
                          setActiveTab('find-food');
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        Find Best NGO Match
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Redistribution History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-emerald-700" />
          <h3 className="font-bold text-slate-900">Completed Batches & Impact Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Batch Name</th>
                <th className="py-2.5 px-3">Servings</th>
                <th className="py-2.5 px-3">Delivered To</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Date Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedDonations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    No completed donations logged yet. Completed batches will appear here.
                  </td>
                </tr>
              ) : (
                completedDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-semibold text-slate-800">{d.foodName}</td>
                    <td className="py-3 px-3">{d.quantityMeals} meals</td>
                    <td className="py-3 px-3 text-slate-700">{d.claimedByNgoName || 'Verified Partner'}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {d.completedAt ? new Date(d.completedAt).toLocaleDateString() : 'Today'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDonation && (
        <DonationDetailModal
          donation={selectedDonation}
          isOpen={!!selectedDonation}
          onClose={() => setSelectedDonation(null)}
        />
      )}

      {/* Add Donation Modal with Zod & React Hook Form */}
      <DonationFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={addDonation}
      />
    </div>
  );
};
