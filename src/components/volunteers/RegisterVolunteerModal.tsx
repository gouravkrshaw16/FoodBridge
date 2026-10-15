import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  volunteerRegistrationSchema,
  VolunteerRegistrationFormData,
} from '../../schemas/validationSchemas';
import { Volunteer } from '../../types';
import { Modal } from '../common/Modal';
import { Bike, Phone, Mail, MapPin } from 'lucide-react';

interface RegisterVolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Volunteer, 'id' | 'createdAt' | 'completedDeliveriesCount'>) => void;
}

export const RegisterVolunteerModal: React.FC<RegisterVolunteerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VolunteerRegistrationFormData>({
    resolver: zodResolver(volunteerRegistrationSchema) as any,
    defaultValues: {
      name: '',
      contactPhone: '',
      contactEmail: '',
      serviceArea: 'Central Metro & University Corridor',
      vehicleType: 'Two-Wheeler',
    },
  });

  const onFormSubmit = (data: VolunteerRegistrationFormData) => {
    onSubmit({
      name: data.name,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      serviceArea: data.serviceArea,
      vehicleType: data.vehicleType,
      status: 'Available',
      isVerified: true,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Delivery Volunteer"
      subtitle="Join the green redistribution fleet to transport food safely"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Volunteer Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="e.g. Vikramaditya Rathore"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
          {errors.name && <p className="text-rose-500 mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mobile Phone <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                {...register('contactPhone')}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            {errors.contactPhone && (
              <p className="text-rose-500 mt-1">{errors.contactPhone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                {...register('contactEmail')}
                placeholder="courier@foodbridge.org"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            {errors.contactEmail && (
              <p className="text-rose-500 mt-1">{errors.contactEmail.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Service Coverage Area / Zone <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              {...register('serviceArea')}
              placeholder="e.g. North University Campus & Tech Park"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          {errors.serviceArea && (
            <p className="text-rose-500 mt-1">{errors.serviceArea.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Vehicle Type
          </label>
          <select
            {...register('vehicleType')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="Two-Wheeler">Two-Wheeler (Motorcycle / Scooter)</option>
            <option value="Car / Van">Car / Van (Heavy Cargo Capacity)</option>
            <option value="Bicycle">Bicycle (Eco Short-Distance)</option>
            <option value="Electric Cargo">Electric Cargo Vehicle (Eco High-Volume)</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
            {isSubmitting ? 'Registering...' : 'Complete Volunteer Registration'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
