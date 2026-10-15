import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FoodDonation, DonationStatus, FoodCategory } from '../../types';
import { StatusBadge, VegBadge, FoodSafetyLevelBadge } from '../common/Badge';
import { FoodSafetyNotice } from '../common/FoodSafetyNotice';
import { DonationFormModal } from './DonationFormModal';
import { DonationDetailModal } from './DonationDetailModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  UtensilsCrossed,
  X,
  AlertTriangle,
  Ban,
} from 'lucide-react';

export const FoodDonationManagement: React.FC = () => {
  const {
    donations,
    addDonation,
    updateDonation,
    deleteDonation,
    markDonationPickedUp,
    markDonationCompleted,
    cancelDonation,
    setSelectedDonationForMatch,
    setActiveTab,
    currentRole,
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<string>('All');
  const [quantityFilter, setQuantityFilter] = useState<string>('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<FoodDonation | null>(null);
  const [viewingDonation, setViewingDonation] = useState<FoodDonation | null>(null);
  const [donationToDelete, setDonationToDelete] = useState<FoodDonation | null>(null);

  // Filtered donations
  const filteredDonations = useMemo(() => {
    return donations.filter((item) => {
      // Search
      const matchesSearch =
        item.foodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.allergens && item.allergens.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status
      const matchesStatus =
        selectedStatus === 'All' || item.status === selectedStatus;

      // Category
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      // Dietary
      const matchesDietary =
        dietaryFilter === 'All' ||
        (dietaryFilter === 'Veg' && item.isVegetarian) ||
        (dietaryFilter === 'NonVeg' && !item.isVegetarian);

      // Quantity range
      let matchesQuantity = true;
      if (quantityFilter === 'small') {
        matchesQuantity = item.quantityMeals < 50;
      } else if (quantityFilter === 'medium') {
        matchesQuantity = item.quantityMeals >= 50 && item.quantityMeals <= 100;
      } else if (quantityFilter === 'large') {
        matchesQuantity = item.quantityMeals > 100;
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesDietary && matchesQuantity;
    });
  }, [donations, searchQuery, selectedStatus, selectedCategory, dietaryFilter, quantityFilter]);

  const handleStartMatch = (donation: FoodDonation) => {
    setSelectedDonationForMatch(donation);
    setActiveTab('find-food');
  };

  const handleFormSubmit = (data: Omit<FoodDonation, 'id' | 'createdAt' | 'status' | 'statusHistory'>) => {
    if (editingDonation) {
      updateDonation(editingDonation.id, data);
      setEditingDonation(null);
    } else {
      addDonation(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Food Safety Banner */}
      <FoodSafetyNotice />

      {/* Control Bar: Filters & Action Button */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by food name, donor canteen, street address, or allergen..."
              className="w-full pl-9.5 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => {
              setEditingDonation(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Surplus Food</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filters:
          </span>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Claimed">Claimed</option>
            <option value="Picked Up">Picked Up</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Expired">Expired</option>
          </select>

          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">All Categories</option>
            <option value="Cooked Meals">Cooked Meals</option>
            <option value="Fruits">Fruits</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Bakery Items">Bakery Items</option>
            <option value="Packaged Food">Packaged Food</option>
            <option value="Other">Other</option>
          </select>

          {/* Dietary Select */}
          <select
            value={dietaryFilter}
            onChange={(e) => setDietaryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">All Diets</option>
            <option value="Veg">Vegetarian Only</option>
            <option value="NonVeg">Non-Vegetarian</option>
          </select>

          {/* Quantity Range Select */}
          <select
            value={quantityFilter}
            onChange={(e) => setQuantityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">All Lot Sizes</option>
            <option value="small">&lt; 50 Meals</option>
            <option value="medium">50 - 100 Meals</option>
            <option value="large">&gt; 100 Meals</option>
          </select>

          {(selectedStatus !== 'All' ||
            selectedCategory !== 'All' ||
            dietaryFilter !== 'All' ||
            quantityFilter !== 'All' ||
            searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatus('All');
                setSelectedCategory('All');
                setDietaryFilter('All');
                setQuantityFilter('All');
                setSearchQuery('');
              }}
              className="text-emerald-700 hover:text-emerald-900 font-semibold underline ml-auto text-xs cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Donations Content: Responsive Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registered Surplus Food Lots</h2>
            <p className="text-xs text-slate-500">
              Showing {filteredDonations.length} of {donations.length} total tracked lots
            </p>
          </div>
        </div>

        {filteredDonations.length === 0 ? (
          <div className="p-12 text-center">
            <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No Food Batches Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Try adjusting your filter search parameters or register a new batch of surplus food.
            </p>
            <button
              onClick={() => {
                setEditingDonation(null);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 cursor-pointer"
            >
              Add First Donation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Food Batch Details</th>
                  <th className="px-4 py-3.5">Donor Origin</th>
                  <th className="px-4 py-3.5 text-center">Quantity</th>
                  <th className="px-4 py-3.5">Pickup Cutoff</th>
                  <th className="px-4 py-3.5">Status & Safety</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonations.map((item) => {
                  const deadlineEpoch = new Date(item.collectionDeadline).getTime();
                  const isExpired = deadlineEpoch <= Date.now() || item.status === 'Expired';
                  const hoursLeft = ((deadlineEpoch - Date.now()) / (1000 * 60 * 60)).toFixed(1);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Food & Category */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <VegBadge isVegetarian={item.isVegetarian} />
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                            {item.category}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                          {item.foodName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Storage: {item.storageRequirement}
                        </p>
                      </td>

                      {/* Donor */}
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-800">{item.donorName}</p>
                        <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 font-medium">
                          {item.donorType}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 max-w-[180px] truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.pickupLocation}</span>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-base font-black text-emerald-800 block">
                          {item.quantityMeals}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Meals ({item.quantity} {item.quantityUnit})
                        </span>
                      </td>

                      {/* Pickup Window */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {new Date(item.collectionDeadline).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(item.collectionDeadline).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Status & Safety Badges */}
                      <td className="px-4 py-4 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusBadge status={item.status} size="sm" />
                          <FoodSafetyLevelBadge
                            collectionDeadline={item.collectionDeadline}
                            status={item.status}
                          />
                        </div>
                        {item.claimedByNgoName && (
                          <p className="text-[10px] text-slate-600 truncate max-w-[140px]" title={item.claimedByNgoName}>
                            Claimed: {item.claimedByNgoName}
                          </p>
                        )}
                        {item.assignedVolunteerName && (
                          <p className="text-[10px] text-indigo-700 truncate max-w-[140px] flex items-center gap-1">
                            <Truck className="w-3 h-3 text-indigo-500" />
                            {item.assignedVolunteerName}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect View */}
                          <button
                            onClick={() => setViewingDonation(item)}
                            title="Inspect Details & Audit Trail"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Matching Engine shortcut if available */}
                          {item.status === 'Available' && !isExpired && (
                            <button
                              onClick={() => handleStartMatch(item)}
                              title="Match with verified NGOs"
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden lg:inline">Match</span>
                            </button>
                          )}

                          {/* Quick Progress button for Claimed -> Picked Up */}
                          {item.status === 'Claimed' && (
                            <button
                              onClick={() => markDonationPickedUp(item.id)}
                              title="Mark food as Picked Up"
                              className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Pick Up</span>
                            </button>
                          )}

                          {/* Quick Progress button for Picked Up -> Completed */}
                          {item.status === 'Picked Up' && (
                            <button
                              onClick={() => markDonationCompleted(item.id)}
                              title="Confirm delivery to NGO shelter"
                              className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span className="hidden sm:inline">Complete</span>
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            onClick={() => {
                              setEditingDonation(item);
                              setIsAddModalOpen(true);
                            }}
                            title="Edit donation details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => setDonationToDelete(item)}
                            title="Delete donation"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <DonationFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingDonation(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingDonation}
      />

      {/* View Detail & Audit Trail Modal */}
      <DonationDetailModal
        donation={viewingDonation}
        isOpen={!!viewingDonation}
        onClose={() => setViewingDonation(null)}
        onFindMatch={handleStartMatch}
        onMarkPickedUp={markDonationPickedUp}
        onMarkCompleted={markDonationCompleted}
        onCancelDonation={cancelDonation}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!donationToDelete}
        onClose={() => setDonationToDelete(null)}
        onConfirm={() => {
          if (donationToDelete) {
            deleteDonation(donationToDelete.id);
            setDonationToDelete(null);
          }
        }}
        title="Delete Food Donation?"
        message={`Are you sure you want to remove "${donationToDelete?.foodName}"? This record will be permanently deleted.`}
        confirmText="Delete Donation"
        variant="danger"
      />
    </div>
  );
};
