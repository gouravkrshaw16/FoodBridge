import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  foodDonationSchema,
  FoodDonationFormData,
  FOOD_CATEGORIES,
  STORAGE_REQUIREMENTS,
  QUANTITY_UNITS,
  DONOR_TYPES,
} from '../../schemas/validationSchemas';
import { FoodDonation } from '../../types';
import { Modal } from '../common/Modal';
import {
  Utensils,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Thermometer,
  Info,
  Building,
} from 'lucide-react';

interface DonationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<FoodDonation, 'id' | 'createdAt' | 'status' | 'statusHistory'>) => void;
  initialData?: FoodDonation | null;
}

const COMMON_DIETARY_OPTIONS = [
  'Pure Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Nut-Free',
  'Dairy-Free (Lactose-Free)',
  'Halal-Compliant',
];

export const DonationFormModal: React.FC<DonationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const defaultPrepTime = new Date().toISOString().slice(0, 16);
  const defaultDeadline = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FoodDonationFormData>({
    resolver: zodResolver(foodDonationSchema) as any,
    defaultValues: {
      foodName: '',
      category: 'Cooked Meals',
      isVegetarian: true,
      quantity: 50,
      quantityUnit: 'Meals / Servings',
      quantityMeals: 50,
      donorName: 'The Green Bistro',
      donorType: 'Restaurant',
      pickupLocation: '42 Market Street, Commercial District',
      donorContact: '+91 98765 43210 (Kitchen Dispatch)',
      preparationTime: defaultPrepTime,
      collectionDeadline: defaultDeadline,
      storageRequirement: 'Refrigerated (< 4°C)',
      temperatureRequirement: 'Store below 4°C in food-grade chilled containers',
      allergens: 'None',
      dietaryRestrictions: ['Pure Vegetarian'],
      additionalNotes: '',
      specialHandlingInstructions: 'Thermal insulated transport box required.',
      safetyConfirmedByDonor: true,
    },
  });

  const watchedQuantity = watch('quantity');
  const watchedQuantityUnit = watch('quantityUnit');
  const watchedStorageReq = watch('storageRequirement');
  const watchedDietary = watch('dietaryRestrictions') || [];

  // Recalculate estimated meals when quantity or unit changes
  useEffect(() => {
    if (!watchedQuantity || Number(watchedQuantity) <= 0) return;
    const q = Number(watchedQuantity);
    if (watchedQuantityUnit === 'Meals / Servings') {
      setValue('quantityMeals', q);
    } else if (watchedQuantityUnit === 'Kilograms (kg)') {
      setValue('quantityMeals', Math.round(q * 2.4));
    } else if (watchedQuantityUnit === 'Trays') {
      setValue('quantityMeals', q * 20);
    } else if (watchedQuantityUnit === 'Boxes / Crates') {
      setValue('quantityMeals', q * 15);
    } else if (watchedQuantityUnit === 'Packages') {
      setValue('quantityMeals', q);
    }
  }, [watchedQuantity, watchedQuantityUnit, setValue]);

  // Adjust temperature guide based on storage requirement
  useEffect(() => {
    if (watchedStorageReq === 'Keep Warm (> 60°C)') {
      setValue('temperatureRequirement', 'Maintain above 65°C in thermal Bain-Marie containers');
    } else if (watchedStorageReq === 'Refrigerated (< 4°C)') {
      setValue('temperatureRequirement', 'Store below 4°C in food-grade chilled containers');
    } else if (watchedStorageReq === 'Frozen (< -18°C)') {
      setValue('temperatureRequirement', 'Maintain solid freeze below -18°C');
    } else if (watchedStorageReq === 'Room Temperature') {
      setValue('temperatureRequirement', 'Cool, dry ventilated environment (18°C - 24°C)');
    } else {
      setValue('temperatureRequirement', 'Standard dry storage, away from direct sunlight');
    }
  }, [watchedStorageReq, setValue]);

  // Sync initialData if provided (for edit)
  useEffect(() => {
    if (initialData) {
      reset({
        foodName: initialData.foodName,
        category: initialData.category,
        isVegetarian: initialData.isVegetarian,
        quantity: initialData.quantity || initialData.quantityMeals,
        quantityUnit: initialData.quantityUnit || 'Meals / Servings',
        quantityMeals: initialData.quantityMeals,
        donorName: initialData.donorName,
        donorType: initialData.donorType,
        pickupLocation: initialData.pickupLocation,
        donorContact: initialData.donorContact,
        preparationTime: initialData.preparationTime
          ? new Date(initialData.preparationTime).toISOString().slice(0, 16)
          : defaultPrepTime,
        collectionDeadline: initialData.collectionDeadline
          ? new Date(initialData.collectionDeadline).toISOString().slice(0, 16)
          : defaultDeadline,
        storageRequirement: initialData.storageRequirement,
        temperatureRequirement: initialData.temperatureRequirement || '',
        allergens: initialData.allergens || '',
        dietaryRestrictions: initialData.dietaryRestrictions || [],
        additionalNotes: initialData.additionalNotes || '',
        specialHandlingInstructions: initialData.specialHandlingInstructions || '',
        safetyConfirmedByDonor: Boolean(initialData.safetyConfirmedByDonor),
      });
    }
  }, [initialData, reset, defaultPrepTime, defaultDeadline]);

  const onFormSubmit = (data: FoodDonationFormData) => {
    onSubmit({
      ...data,
      preparationTime: new Date(data.preparationTime).toISOString(),
      collectionDeadline: new Date(data.collectionDeadline).toISOString(),
    });
    onClose();
  };

  const toggleDietaryTag = (tag: string) => {
    const current = [...watchedDietary];
    const index = current.indexOf(tag);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(tag);
    }
    setValue('dietaryRestrictions', current);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Surplus Food Batch' : 'Register Surplus Food Batch'}
      subtitle="Standardized Zod validation ensures food hygiene and pickup dispatch safety"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Section 1: Food Specifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
            <Utensils className="w-4 h-4 text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Food Description & Dietary Category
            </h4>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Food Item Name / Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('foodName')}
              placeholder="e.g. Freshly Prepared Steamed Rice & Dal Makhani"
              className={`w-full px-3.5 py-2 text-sm rounded-xl border transition-all ${
                errors.foodName
                  ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
              }`}
            />
            {errors.foodName && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.foodName.message}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Food Category <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('category')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white"
              >
                {FOOD_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dietary Classification
              </label>
              <div className="flex items-center gap-2 pt-1.5">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="radio"
                    value="veg"
                    checked={watch('isVegetarian') === true}
                    onChange={() => setValue('isVegetarian', true)}
                    className="text-emerald-700 focus:ring-emerald-500"
                  />
                  <span>Pure Vegetarian</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 ml-3">
                  <input
                    type="radio"
                    value="non-veg"
                    checked={watch('isVegetarian') === false}
                    onChange={() => setValue('isVegetarian', false)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>Non-Vegetarian</span>
                </label>
              </div>
            </div>
          </div>

          {/* Quantity and Meals Normalizer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                {...register('quantity', { valueAsNumber: true })}
                className={`w-full px-3 py-1.5 text-sm rounded-lg border bg-white ${
                  errors.quantity ? 'border-rose-300' : 'border-slate-200'
                }`}
              />
              {errors.quantity && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measure
              </label>
              <select
                {...register('quantityUnit')}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white"
              >
                {QUANTITY_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Servings
              </label>
              <input
                type="number"
                {...register('quantityMeals', { valueAsNumber: true })}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-emerald-300 bg-emerald-50/50 font-bold text-emerald-900"
              />
              <span className="text-[10px] text-slate-500">Auto-normalized meals</span>
            </div>
          </div>
        </div>

        {/* Section 2: Donor & Pickup Location */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
            <Building className="w-4 h-4 text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Donor Details & Pickup Location
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Donor Organization <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('donorName')}
                placeholder="e.g. Grand Horizon Hotel"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200"
              />
              {errors.donorName && (
                <p className="mt-1 text-xs text-rose-600">{errors.donorName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Donor Type</label>
              <select
                {...register('donorType')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                {DONOR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Exact Pickup Location / Kitchen Gate <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                {...register('pickupLocation')}
                placeholder="Building number, street, loading dock"
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            {errors.pickupLocation && (
              <p className="mt-1 text-xs text-rose-600">{errors.pickupLocation.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Coordinator Phone / Contact <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                {...register('donorContact')}
                placeholder="+91 98765 43210 (Kitchen Supervisor)"
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            {errors.donorContact && (
              <p className="mt-1 text-xs text-rose-600">{errors.donorContact.message}</p>
            )}
          </div>
        </div>

        {/* Section 3: Time Cutoffs & Storage Requirements */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
            <Thermometer className="w-4 h-4 text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Thermal Holding & Pickup Window
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preparation Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                {...register('preparationTime')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              />
              {errors.preparationTime && (
                <p className="mt-1 text-xs text-rose-600">{errors.preparationTime.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Collection Cutoff Deadline <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                {...register('collectionDeadline')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              />
              {errors.collectionDeadline && (
                <p className="mt-1 text-xs text-rose-600">{errors.collectionDeadline.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storage Method
              </label>
              <select
                {...register('storageRequirement')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                {STORAGE_REQUIREMENTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thermal Holding Guideline
              </label>
              <input
                type="text"
                {...register('temperatureRequirement')}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Allergen Advisory & Notes (Optional)
            </label>
            <input
              type="text"
              {...register('allergens')}
              placeholder="e.g. Contains dairy and gluten. Prepared in nut-free kitchen."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>
        </div>

        {/* Section 4: Safety Certification */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              {...register('safetyConfirmedByDonor')}
              className="mt-0.5 rounded-sm text-emerald-700 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-800 leading-snug">
              <strong className="text-emerald-950 font-bold block">
                Food Hygiene & Safety Attestation
              </strong>
              I certify that this surplus food was cooked hygienically, stored according to food safety standards, packaged in clean containers, and is safe for consumption.
            </span>
          </label>
          {errors.safetyConfirmedByDonor && (
            <p className="text-xs text-rose-600 font-medium">
              {errors.safetyConfirmedByDonor.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
            className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Validating...' : initialData ? 'Save Changes' : 'Publish Surplus Batch'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
