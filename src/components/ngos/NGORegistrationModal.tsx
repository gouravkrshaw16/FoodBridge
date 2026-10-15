import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ngoRegistrationSchema,
  NGORegistrationFormData,
  FOOD_CATEGORIES,
  URGENCY_LEVELS,
} from '../../schemas/validationSchemas';
import { NGO, FoodCategory } from '../../types';
import { Modal } from '../common/Modal';
import { Building, MapPin, Phone, Mail, AlertCircle, Users, CheckCircle2 } from 'lucide-react';

interface NGORegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<NGO, 'id' | 'createdAt'>) => void;
}

export const NGORegistrationModal: React.FC<NGORegistrationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NGORegistrationFormData>({
    resolver: zodResolver(ngoRegistrationSchema) as any,
    defaultValues: {
      name: '',
      location: '',
      serviceArea: 'Central Metro District',
      simulatedDistanceKm: 3.2,
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      mealsRequired: 80,
      maxReceivingCapacity: 150,
      acceptedCategories: ['Cooked Meals', 'Fruits', 'Vegetables'],
      acceptsNonVeg: false,
      urgency: 'High',
      operatingHours: '08:00 - 21:00',
      beneficiaryDescription: '',
    },
  });

  const acceptedCategories = watch('acceptedCategories') || [];

  const toggleCategory = (cat: FoodCategory) => {
    const current = [...acceptedCategories];
    const idx = current.indexOf(cat);
    if (idx >= 0) {
      if (current.length > 1) {
        current.splice(idx, 1);
      }
    } else {
      current.push(cat);
    }
    setValue('acceptedCategories', current);
  };

  const onFormSubmit = (data: NGORegistrationFormData) => {
    onSubmit({
      ...data,
      isAvailable: true,
      isVerified: false, // Starts as pending verification for admin approval
    });
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register NGO / Community Food Bank"
      subtitle="Zod-validated intake onboarding with automatic capacity bounding"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Name and Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Organization Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Annapurna Community Kitchen"
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border ${
                  errors.name ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Facility Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                {...register('location')}
                placeholder="Street address, district"
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border ${
                  errors.location ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.location && <p className="mt-1 text-xs text-rose-600">{errors.location.message}</p>}
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Coordinator Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('contactPerson')}
              placeholder="e.g. Maya Sharma"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
            />
            {errors.contactPerson && (
              <p className="mt-1 text-xs text-rose-600">{errors.contactPerson.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                {...register('contactPhone')}
                placeholder="+91 98765 00000"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>
            {errors.contactPhone && (
              <p className="mt-1 text-xs text-rose-600">{errors.contactPhone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                {...register('contactEmail')}
                placeholder="contact@shelter.org"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>
            {errors.contactEmail && (
              <p className="mt-1 text-xs text-rose-600">{errors.contactEmail.message}</p>
            )}
          </div>
        </div>

        {/* Capacity & Meals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Daily Demand (Meals) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              {...register('mealsRequired', { valueAsNumber: true })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            />
            {errors.mealsRequired && (
              <p className="mt-1 text-xs text-rose-600">{errors.mealsRequired.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Max Receiving Capacity <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              {...register('maxReceivingCapacity', { valueAsNumber: true })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-bold text-slate-800"
            />
            {errors.maxReceivingCapacity && (
              <p className="mt-1 text-xs text-rose-600">{errors.maxReceivingCapacity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Level</label>
            <select
              {...register('urgency')}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              {URGENCY_LEVELS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Accepted Categories */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Accepted Food Categories <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {FOOD_CATEGORIES.map((cat) => {
              const selected = acceptedCategories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer border ${
                    selected
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          {errors.acceptedCategories && (
            <p className="mt-1 text-xs text-rose-600">{errors.acceptedCategories.message}</p>
          )}
        </div>

        {/* Dietary and operating hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="ngo-accepts-nonveg"
              {...register('acceptsNonVeg')}
              className="rounded-sm text-emerald-700 focus:ring-emerald-500"
            />
            <label htmlFor="ngo-accepts-nonveg" className="text-xs text-slate-700 cursor-pointer">
              Facility can accept Non-Vegetarian surplus food
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Hours</label>
            <input
              type="text"
              {...register('operatingHours')}
              placeholder="08:00 - 22:00"
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200"
            />
          </div>
        </div>

        {/* Beneficiary description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Community Beneficiary Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            {...register('beneficiaryDescription')}
            placeholder="Describe the demographic served (e.g. night shelters, migrant worker camps, children's home)"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
          />
          {errors.beneficiaryDescription && (
            <p className="mt-1 text-xs text-rose-600">{errors.beneficiaryDescription.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Registering...' : 'Register Organization'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
