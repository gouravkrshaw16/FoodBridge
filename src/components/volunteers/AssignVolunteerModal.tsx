import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  volunteerAssignmentSchema,
  VolunteerAssignmentFormData,
} from '../../schemas/validationSchemas';
import { FoodDonation, Volunteer } from '../../types';
import { Modal } from '../common/Modal';
import { VolunteerStatusBadge } from '../common/Badge';
import { Bike, Truck, CheckCircle2, AlertCircle, MapPin, Phone, ShieldCheck } from 'lucide-react';

interface AssignVolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: FoodDonation | null;
  volunteers: Volunteer[];
  onAssign: (donationId: string, volunteerId: string, volunteerName: string) => void;
}

export const AssignVolunteerModal: React.FC<AssignVolunteerModalProps> = ({
  isOpen,
  onClose,
  donation,
  volunteers,
  onAssign,
}) => {
  const availableVolunteers = volunteers.filter((v) => v.status === 'Available');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VolunteerAssignmentFormData>({
    resolver: zodResolver(volunteerAssignmentSchema) as any,
    defaultValues: {
      donationId: donation?.id || '',
      volunteerId: availableVolunteers[0]?.id || '',
      volunteerName: availableVolunteers[0]?.name || '',
      dispatchNotes: 'Priority direct transport in thermal insulated carrier.',
      estimatedPickupMinutes: 30,
      thermalHoldingConfirmed: true,
    },
  });

  const selectedVolunteerId = watch('volunteerId');

  useEffect(() => {
    if (donation) {
      setValue('donationId', donation.id);
    }
    if (availableVolunteers.length > 0 && !selectedVolunteerId) {
      setValue('volunteerId', availableVolunteers[0].id);
      setValue('volunteerName', availableVolunteers[0].name);
    }
  }, [donation, availableVolunteers, selectedVolunteerId, setValue]);

  if (!donation) return null;

  const handleSelectCourier = (vol: Volunteer) => {
    setValue('volunteerId', vol.id);
    setValue('volunteerName', vol.name);
  };

  const onFormSubmit = (data: VolunteerAssignmentFormData) => {
    onAssign(data.donationId, data.volunteerId, data.volunteerName);
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Delivery Courier"
      subtitle={`Zod-validated courier assignment for "${donation.foodName}"`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-xs">
        {/* Donation Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-800 text-sm">{donation.foodName}</span>
            <span className="font-extrabold text-emerald-800 text-sm">
              {donation.quantityMeals} Meals
            </span>
          </div>
          <p className="text-slate-500 text-[11px] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Pickup: {donation.pickupLocation}
          </p>
          {donation.claimedByNgoName && (
            <p className="text-emerald-800 text-[11px] font-semibold mt-1">
              Destination: {donation.claimedByNgoName}
            </p>
          )}
        </div>

        {/* Volunteer List */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Available Courier ({availableVolunteers.length} Ready):
          </label>

          {availableVolunteers.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <AlertCircle className="w-6 h-6 text-amber-600 mx-auto mb-1.5" />
              <p className="font-bold text-amber-900">No Couriers Currently Idle</p>
              <p className="text-amber-700 text-[11px] mt-0.5">
                All registered couriers are on active delivery runs or off-duty. Register a new volunteer or wait for ongoing deliveries to complete.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {availableVolunteers.map((vol) => {
                const isSelected = selectedVolunteerId === vol.id;
                return (
                  <div
                    key={vol.id}
                    onClick={() => handleSelectCourier(vol)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Bike className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{vol.name}</span>
                          <span className="text-[11px] text-slate-500">({vol.vehicleType})</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">Route: {vol.serviceArea}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <VolunteerStatusBadge status={vol.status} />
                      <p className="text-[10px] text-slate-400 mt-1">
                        {vol.completedDeliveriesCount} trips completed
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {errors.volunteerId && (
            <p className="text-rose-500 mt-1.5">{errors.volunteerId.message}</p>
          )}
        </div>

        {/* Dispatch Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estimated Pickup ETA (Minutes)
            </label>
            <input
              type="number"
              {...register('estimatedPickupMinutes', { valueAsNumber: true })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            />
            {errors.estimatedPickupMinutes && (
              <p className="text-rose-500 mt-1">{errors.estimatedPickupMinutes.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dispatch Instructions
            </label>
            <input
              type="text"
              {...register('dispatchNotes')}
              placeholder="e.g. Ring bell at kitchen rear gate"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            />
          </div>
        </div>

        {/* Thermal holding check */}
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('thermalHoldingConfirmed')}
              className="mt-0.5 rounded-sm text-emerald-700 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-700">
              <strong className="text-emerald-950 font-bold block">Vehicle Holding Box Verification</strong>
              Courier vehicle equipped with clean insulated thermal box maintaining appropriate hot/cold temperatures.
            </span>
          </label>
          {errors.thermalHoldingConfirmed && (
            <p className="text-rose-500 mt-1 font-medium">{errors.thermalHoldingConfirmed.message}</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={availableVolunteers.length === 0 || isSubmitting}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Dispatching...' : 'Confirm Dispatch & Lock Route'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
