import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  userRegistrationSchema,
  UserRegistrationFormData,
} from '../../schemas/validationSchemas';
import { UserRole } from '../../types';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  User,
  Building2,
  Bike,
  Sparkles,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  LogIn,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    setCurrentRole,
    signInWithGoogle,
    signInAsDemoRole,
    registerUserWithProfile,
    signOutUser,
    addToast,
  } = useApp();

  const [authMode, setAuthMode] = useState<'demo' | 'register'>('demo');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserRegistrationFormData>({
    resolver: zodResolver(userRegistrationSchema) as any,
    defaultValues: {
      email: '',
      displayName: '',
      role: 'donor',
      organizationName: '',
      phone: '',
    },
  });

  const selectedRole = watch('role');

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      addToast('success', 'Authenticated with Google', 'You are now signed in to FoodBridge AI.');
      onClose();
    } catch (e) {
      addToast('error', 'Authentication Error', 'Could not complete Google popup sign-in.');
    }
  };

  const handleDemoSignIn = async (role: UserRole) => {
    await signInAsDemoRole(role);
    addToast('success', 'Session Initialized', `Now operating under ${role.toUpperCase()} perspective.`);
    onClose();
  };

  const onRegisterSubmit = async (data: UserRegistrationFormData) => {
    try {
      await registerUserWithProfile(data);
      addToast('success', 'Profile Created', `Welcome to FoodBridge AI, ${data.displayName}!`);
      onClose();
    } catch (e) {
      addToast('error', 'Registration Error', 'Failed to save profile to Firestore.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentUser ? 'User Profile & Identity' : 'Sign In to FoodBridge AI'}
      subtitle="Role-Based Access Control verified through Cloud Firestore Security Rules"
      maxWidth="md"
    >
      <div className="space-y-5 text-xs">
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-lg">
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-sm">{currentUser.displayName || 'Authenticated User'}</h4>
                <p className="text-slate-500 text-xs">{currentUser.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  Role: {currentUser.role}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  signOutUser();
                  onClose();
                }}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold cursor-pointer transition-colors"
              >
                Sign Out
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Selector */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setAuthMode('demo')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'demo' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Fast Role Switcher (Hackathon)
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'register' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Register New User (Zod)
              </button>
            </div>

            {authMode === 'demo' ? (
              <div className="space-y-3">
                <p className="text-slate-500 text-xs">
                  Select a verified identity to test role-specific workflows and security boundaries:
                </p>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleDemoSignIn('donor')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">Food Donor</span>
                        <span className="text-[11px] text-slate-500">The Green Bistro (Commercial Kitchen)</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      Enter →
                    </span>
                  </button>

                  <button
                    onClick={() => handleDemoSignIn('ngo')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">NGO Recipient Partner</span>
                        <span className="text-[11px] text-slate-500">City Food Rescue Shelter</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      Enter →
                    </span>
                  </button>

                  <button
                    onClick={() => handleDemoSignIn('volunteer')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                        <Bike className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">Delivery Volunteer</span>
                        <span className="text-[11px] text-slate-500">Alex Rivera (Insulated Two-Wheeler)</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      Enter →
                    </span>
                  </button>

                  <button
                    onClick={() => handleDemoSignIn('admin')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-800 hover:bg-slate-100 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">System Administrator</span>
                        <span className="text-[11px] text-slate-500">buildingthefuture0007@gmail.com</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                      Enter →
                    </span>
                  </button>
                </div>

                {/* Google Sign In option */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google Account</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name / Contact Person <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('displayName')}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                  {errors.displayName && (
                    <p className="text-rose-600 mt-1">{errors.displayName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="priya@organization.org"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                  {errors.email && <p className="text-rose-600 mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Your Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('role')}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="donor">Food Donor (Restaurant / Canteen / Hotel)</option>
                    <option value="ngo">NGO Partner / Community Shelter</option>
                    <option value="volunteer">Delivery Volunteer Courier</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Self-assignment of Administrator role is blocked by Firestore Security Rules.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organization / Establishment Name
                  </label>
                  <input
                    type="text"
                    {...register('organizationName')}
                    placeholder="e.g. Campus Central Cafeteria"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAuthMode('demo')}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Registering...' : 'Create Account'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
