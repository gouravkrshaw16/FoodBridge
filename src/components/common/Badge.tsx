import React from 'react';
import { DonationStatus, UrgencyLevel, VolunteerStatus, UserRole } from '../../types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Truck,
  PackageCheck,
  Ban,
  ShieldCheck,
  Flame,
  User,
  Building2,
  Bike,
  Shield,
} from 'lucide-react';

export const StatusBadge: React.FC<{ status: DonationStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  switch (status) {
    case 'Available':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Available
        </span>
      );
    case 'Claimed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
          Claimed
        </span>
      );
    case 'Picked Up':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}
        >
          <Truck className="w-3.5 h-3.5 text-indigo-600" />
          Picked Up
        </span>
      );
    case 'Completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 ${sizeClasses}`}
        >
          <PackageCheck className="w-3.5 h-3.5 text-emerald-700" />
          Completed
        </span>
      );
    case 'Expired':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Expired
        </span>
      );
    case 'Cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}
        >
          <Ban className="w-3.5 h-3.5 text-slate-500" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-gray-100 text-gray-700 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};

export const UrgencyBadge: React.FC<{ urgency: UrgencyLevel }> = ({ urgency }) => {
  switch (urgency) {
    case 'Critical':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
          <Flame className="w-3 h-3 text-rose-600" />
          Critical
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
          <AlertTriangle className="w-3 h-3 text-orange-600" />
          High
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          Medium
        </span>
      );
    case 'Low':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          Low
        </span>
      );
  }
};

export const VegBadge: React.FC<{ isVegetarian: boolean }> = ({ isVegetarian }) => {
  return isVegetarian ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
      Pure Veg
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-800 border border-red-300">
      <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
      Non-Veg
    </span>
  );
};

export const VolunteerStatusBadge: React.FC<{ status: VolunteerStatus }> = ({ status }) => {
  switch (status) {
    case 'Available':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Ready for Dispatch
        </span>
      );
    case 'On Delivery':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Truck className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
          On Active Run
        </span>
      );
    case 'Off Duty':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          Off Duty
        </span>
      );
  }
};

export const FoodSafetyLevelBadge: React.FC<{
  collectionDeadline: string;
  status: DonationStatus;
}> = ({ collectionDeadline, status }) => {
  const now = Date.now();
  const deadlineEpoch = new Date(collectionDeadline).getTime();
  const hoursLeft = (deadlineEpoch - now) / (1000 * 60 * 60);

  if (status === 'Expired' || hoursLeft <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
        <XCircle className="w-3 h-3 text-rose-600" />
        Critical: Past Safe Window
      </span>
    );
  }

  if (hoursLeft <= 2) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
        <AlertTriangle className="w-3 h-3 text-rose-600" />
        Urgent: &lt; 2h Remaining
      </span>
    );
  }

  if (hoursLeft <= 4) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        Warning: &lt; 4h Cutoff
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
      <ShieldCheck className="w-3 h-3 text-emerald-600" />
      Thermal Safe: {hoursLeft.toFixed(1)}h
    </span>
  );
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  switch (role) {
    case 'donor':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
          <User className="w-3 h-3 text-emerald-700" />
          Donor View
        </span>
      );
    case 'ngo':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-200">
          <Building2 className="w-3 h-3 text-sky-700" />
          NGO View
        </span>
      );
    case 'volunteer':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
          <Bike className="w-3 h-3 text-amber-700" />
          Volunteer View
        </span>
      );
    case 'admin':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
          <Shield className="w-3 h-3 text-purple-700" />
          Administrator View
        </span>
      );
  }
};
