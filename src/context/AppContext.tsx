import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  FoodDonation,
  NGO,
  Volunteer,
  ActiveTab,
  DonationStatus,
  ToastMessage,
  UserRole,
  StatusHistoryEntry,
} from '../types';
import { INITIAL_DONATIONS, INITIAL_NGOS, INITIAL_VOLUNTEERS } from '../data/initialData';
import { getCommittedMealsForNGO, getRemainingCapacityForNGO } from '../utils/matchingEngine';
import {
  auth,
  googleProvider,
  testFirestoreConnection,
} from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  subscribeToDonations,
  subscribeToNGOs,
  subscribeToVolunteers,
  createDonationInFirestore,
  updateDonationInFirestore,
  deleteDonationInFirestore,
  claimDonationWithTransaction,
  assignVolunteerWithTransaction,
  transitionDonationStatusWithTransaction,
  createNGOInFirestore,
  updateNGOInFirestore,
  createVolunteerInFirestore,
  updateVolunteerInFirestore,
  getUserProfile,
  saveUserProfile,
  checkAndMigrateDemoData,
} from '../lib/dbService';
import { UserProfileFormData, UserRegistrationFormData } from '../schemas/validationSchemas';

const STORAGE_KEYS = {
  DONATIONS: 'foodbridge_ai_donations_v3',
  NGOS: 'foodbridge_ai_ngos_v3',
  VOLUNTEERS: 'foodbridge_ai_volunteers_v3',
  ROLE: 'foodbridge_ai_role_v3',
  DEMO_USER: 'foodbridge_ai_demo_user_v3',
};

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationName?: string;
  isVerified?: boolean;
}

interface AppContextType {
  donations: FoodDonation[];
  ngos: NGO[];
  volunteers: Volunteer[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  selectedDonationForMatch: FoodDonation | null;
  setSelectedDonationForMatch: (donation: FoodDonation | null) => void;

  // Authentication & RBAC
  currentUser: AppUser | null;
  isAuthLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsDemoRole: (role: UserRole) => Promise<void>;
  registerUserWithProfile: (formData: UserRegistrationFormData) => Promise<void>;
  signOutUser: () => Promise<void>;
  isFirestoreConnected: boolean;

  // Donation Lifecycle Actions (Backed by Firestore Transactions)
  addDonation: (donationData: Omit<FoodDonation, 'id' | 'createdAt' | 'status' | 'statusHistory'>) => Promise<FoodDonation>;
  updateDonation: (id: string, updates: Partial<FoodDonation>) => Promise<boolean>;
  deleteDonation: (id: string) => Promise<boolean>;
  claimDonation: (donationId: string, ngoId: string, ngoName: string, actorName?: string) => Promise<boolean>;
  assignVolunteer: (donationId: string, volunteerId: string, volunteerName: string, actorName?: string) => Promise<boolean>;
  markDonationPickedUp: (donationId: string, actorName?: string) => Promise<boolean>;
  markDonationCompleted: (donationId: string, actorName?: string, notes?: string) => Promise<boolean>;
  cancelDonation: (donationId: string, reason: string, actorName?: string) => Promise<boolean>;

  // NGO Operations
  addNGO: (ngoData: Omit<NGO, 'id' | 'createdAt'>) => Promise<NGO>;
  toggleNGOAvailability: (id: string) => Promise<void>;
  updateNGOCapacity: (id: string, newCapacity: number) => Promise<void>;
  toggleNGOVerification: (id: string) => Promise<void>;

  // Volunteer Operations
  addVolunteer: (volData: Omit<Volunteer, 'id' | 'createdAt' | 'completedDeliveriesCount'>) => Promise<Volunteer>;
  updateVolunteerStatus: (id: string, status: Volunteer['status']) => Promise<void>;

  // Toast Notifications
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Guided Demonstration Engine
  demoStep: number;
  isDemoActive: boolean;
  startGuidedDemo: () => void;
  advanceDemoStep: () => void;
  skipDemoStep: () => void;
  exitGuidedDemo: () => void;
  resetDemoData: () => void;

  // Computed live analytics & safety metrics
  stats: {
    totalMealsListed: number;
    availableMeals: number;
    activeDonationsCount: number;
    registeredNGOsCount: number;
    mealsRedistributed: number;
    completedDonationsCount: number;
    expiredDonationsCount: number;
    cancelledDonationsCount: number;
    activeDonorsCount: number;
    ngosActiveCount: number;
    averagePickupMinutes: number;
    co2KgSaved: number;
    waterLitersSaved: number;
  };
  urgentDonations: FoodDonation[];
  expiredDonations: FoodDonation[];

  // Helper getters
  getNGORemainingCapacity: (ngoId: string) => number;
  getNGOCommittedMeals: (ngoId: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Safe localStorage helper
  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(fallback) && !Array.isArray(parsed)) {
          return fallback;
        }
        return parsed;
      }
    } catch (e) {
      console.warn(`Error reading localStorage key ${key}. Falling back to default data.`, e);
    }
    return fallback;
  };

  const [donations, setDonations] = useState<FoodDonation[]>(() =>
    loadStored(STORAGE_KEYS.DONATIONS, INITIAL_DONATIONS)
  );
  const [ngos, setNgos] = useState<NGO[]>(() =>
    loadStored(STORAGE_KEYS.NGOS, INITIAL_NGOS)
  );
  const [volunteers, setVolunteers] = useState<Volunteer[]>(() =>
    loadStored(STORAGE_KEYS.VOLUNTEERS, INITIAL_VOLUNTEERS)
  );
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() =>
    (loadStored(STORAGE_KEYS.ROLE, 'admin') as UserRole) || 'admin'
  );

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = loadStored<AppUser | null>(STORAGE_KEYS.DEMO_USER, null);
    if (saved) return saved;
    // Default admin demo user
    return {
      uid: 'admin-demo-uid',
      email: 'buildingthefuture0007@gmail.com',
      displayName: 'System Administrator',
      role: 'admin',
      isVerified: true,
    };
  });

  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedDonationForMatch, setSelectedDonationForMatch] = useState<FoodDonation | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Guided Demo Mode State (0 = inactive, 1..9 = active step)
  const [demoStep, setDemoStep] = useState<number>(0);
  const isDemoActive = demoStep > 0;

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    if (currentUser) {
      const updated = { ...currentUser, role };
      setCurrentUser(updated);
      try {
        localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(updated));
      } catch {}
    }
    try {
      localStorage.setItem(STORAGE_KEYS.ROLE, JSON.stringify(role));
    } catch {}
  };

  // Sync to localStorage as offline safety buffer
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donations));
    } catch {}
  }, [donations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NGOS, JSON.stringify(ngos));
    } catch {}
  }, [ngos]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOLUNTEERS, JSON.stringify(volunteers));
    } catch {}
  }, [volunteers]);

  // Test Firestore Connection and attach live listeners
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    async function initFirestoreSync() {
      const connected = await testFirestoreConnection();
      setIsFirestoreConnected(connected);

      // Check and seed initial data if remote is empty
      checkAndMigrateDemoData(false).catch((err) =>
        console.warn('Silent check of demo seed data in Firestore:', err)
      );

      // Attach real-time listeners for live sync across clients
      try {
        const unsubDonations = subscribeToDonations(
          (liveDonations) => {
            if (liveDonations && liveDonations.length > 0) {
              setDonations(liveDonations);
            }
          },
          (err) => console.warn('Donations Firestore sync notice:', err)
        );
        unsubs.push(unsubDonations);

        const unsubNGOs = subscribeToNGOs(
          (liveNGOs) => {
            if (liveNGOs && liveNGOs.length > 0) {
              setNgos(liveNGOs);
            }
          },
          (err) => console.warn('NGOs Firestore sync notice:', err)
        );
        unsubs.push(unsubNGOs);

        const unsubVolunteers = subscribeToVolunteers(
          (liveVolunteers) => {
            if (liveVolunteers && liveVolunteers.length > 0) {
              setVolunteers(liveVolunteers);
            }
          },
          (err) => console.warn('Volunteers Firestore sync notice:', err)
        );
        unsubs.push(unsubVolunteers);
      } catch (err) {
        console.warn('Real-time listener setup caught:', err);
      }
    }

    initFirestoreSync();

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, []);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          const role = profile?.role || (firebaseUser.email === 'buildingthefuture0007@gmail.com' ? 'admin' : 'donor');
          const userObj: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: profile?.displayName || firebaseUser.displayName || 'Authorized User',
            role,
            organizationName: profile?.organizationName,
            isVerified: firebaseUser.emailVerified || profile?.isVerified,
          };
          setCurrentUser(userObj);
          setCurrentRoleState(role);
          localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(userObj));
        } catch (e) {
          console.warn('Error reading profile on auth state change:', e);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Periodic deadline watchdog
  useEffect(() => {
    const checkDeadlines = () => {
      const now = Date.now();
      setDonations((prev) =>
        prev.map((d) => {
          if (d.status === 'Available') {
            const deadline = new Date(d.collectionDeadline).getTime();
            if (deadline <= now) {
              const expireEntry: StatusHistoryEntry = {
                id: 'hist-exp-' + Math.random().toString(36).substring(2, 7),
                status: 'Expired',
                timestamp: new Date().toISOString(),
                actor: 'System (Safety Watchdog)',
                notes: 'Collection deadline elapsed without pickup reservation. Auto-expired to preserve food hygiene.',
              };
              return {
                ...d,
                status: 'Expired',
                statusHistory: [...(d.statusHistory || []), expireEntry],
              };
            }
          }
          return d;
        })
      );
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 30000);
    return () => clearInterval(interval);
  }, []);

  // Toast Helpers
  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper getters for capacity
  const getNGORemainingCapacity = (ngoId: string): number => {
    const ngo = ngos.find((n) => n.id === ngoId);
    if (!ngo) return 0;
    return getRemainingCapacityForNGO(ngo, donations);
  };

  const getNGOCommittedMeals = (ngoId: string): number => {
    return getCommittedMealsForNGO(ngoId, donations);
  };

  // ==========================================
  // AUTHENTICATION METHODS
  // ==========================================

  const signInWithGoogle = async () => {
    setIsAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      let profile = await getUserProfile(user.uid);

      const role: UserRole =
        user.email === 'buildingthefuture0007@gmail.com' ? 'admin' : profile?.role || 'donor';

      if (!profile) {
        await saveUserProfile({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Authorized User',
          role,
          isVerified: user.emailVerified,
          createdAt: new Date().toISOString(),
        });
      }

      const userObj: AppUser = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Authorized User',
        role,
        isVerified: user.emailVerified,
      };

      setCurrentUser(userObj);
      setCurrentRoleState(role);
      localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(userObj));
    } catch (err) {
      console.error('Google Sign-in caught:', err);
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signInAsDemoRole = async (role: UserRole) => {
    const demoProfiles: Record<UserRole, AppUser> = {
      donor: {
        uid: 'demo-donor-bistro',
        email: 'kitchen@greenbistro.com',
        displayName: 'The Green Bistro',
        role: 'donor',
        organizationName: 'The Green Bistro',
        isVerified: true,
      },
      ngo: {
        uid: 'demo-ngo-asha',
        email: 'shelter@ashafoundation.org',
        displayName: 'Asha Food Rescue Shelter',
        role: 'ngo',
        organizationName: 'Asha Community Shelter',
        isVerified: true,
      },
      volunteer: {
        uid: 'demo-vol-alex',
        email: 'alex.rivera@expresscouriers.org',
        displayName: 'Alex Rivera (Courier)',
        role: 'volunteer',
        organizationName: 'Rapid Eco Couriers',
        isVerified: true,
      },
      admin: {
        uid: 'demo-admin-system',
        email: 'buildingthefuture0007@gmail.com',
        displayName: 'System Administrator',
        role: 'admin',
        organizationName: 'FoodBridge AI Governance Council',
        isVerified: true,
      },
    };

    const userObj = demoProfiles[role];
    setCurrentUser(userObj);
    setCurrentRoleState(role);
    try {
      localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(userObj));
      localStorage.setItem(STORAGE_KEYS.ROLE, JSON.stringify(role));
    } catch {}
  };

  const registerUserWithProfile = async (formData: UserRegistrationFormData) => {
    setIsAuthLoading(true);
    try {
      const uid = 'user-' + Math.random().toString(36).substring(2, 9);
      const profile: UserProfileFormData = {
        uid,
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
        organizationName: formData.organizationName,
        phone: formData.phone,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore
      await saveUserProfile(profile);

      const userObj: AppUser = {
        uid,
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
        organizationName: formData.organizationName,
        isVerified: false,
      };

      setCurrentUser(userObj);
      setCurrentRoleState(formData.role);
      localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(userObj));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch {}
    setCurrentUser(null);
    setCurrentRoleState('donor');
    localStorage.removeItem(STORAGE_KEYS.DEMO_USER);
    addToast('info', 'Signed Out', 'You have been safely signed out.');
  };

  // ==========================================
  // DONATION ACTIONS (FIRESTORE BACKED)
  // ==========================================

  const addDonation = async (
    donationData: Omit<FoodDonation, 'id' | 'createdAt' | 'status' | 'statusHistory'>
  ): Promise<FoodDonation> => {
    try {
      const created = await createDonationInFirestore(donationData);
      setDonations((prev) => [created, ...prev]);
      addToast(
        'success',
        'Food Batch Published',
        `"${created.foodName}" (${created.quantityMeals} meals) is recorded and live for matching.`
      );
      return created;
    } catch (e) {
      // Local fallback if Firestore fails
      const nowIso = new Date().toISOString();
      const newId = 'don-' + Math.random().toString(36).substring(2, 8);
      const fallback: FoodDonation = {
        ...donationData,
        id: newId,
        status: 'Available',
        createdAt: nowIso,
        statusHistory: [
          {
            id: 'hist-' + Math.random().toString(36).substring(2, 7),
            status: 'Available',
            timestamp: nowIso,
            actor: donationData.donorName,
            notes: 'Surplus food batch recorded to local storage.',
          },
        ],
      };
      setDonations((prev) => [fallback, ...prev]);
      addToast(
        'success',
        'Food Batch Published (Offline Buffer)',
        `"${fallback.foodName}" (${fallback.quantityMeals} meals) listed.`
      );
      return fallback;
    }
  };

  const updateDonation = async (id: string, updates: Partial<FoodDonation>): Promise<boolean> => {
    try {
      await updateDonationInFirestore(id, updates);
    } catch {}
    setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    addToast('success', 'Donation Updated', 'Changes saved successfully.');
    return true;
  };

  const deleteDonation = async (id: string): Promise<boolean> => {
    try {
      await deleteDonationInFirestore(id);
    } catch {}
    setDonations((prev) => prev.filter((d) => d.id !== id));
    addToast('info', 'Donation Removed', 'The food batch has been removed.');
    return true;
  };

  /**
   * ATOMIC FIRESTORE CLAIM
   */
  const claimDonation = async (
    donationId: string,
    ngoId: string,
    ngoName: string,
    actorName?: string
  ): Promise<boolean> => {
    const donation = donations.find((d) => d.id === donationId);
    const ngo = ngos.find((n) => n.id === ngoId);

    if (!donation || !ngo) {
      addToast('error', 'Claim Failed', 'Donation or NGO record not found.');
      return false;
    }

    if (donation.status !== 'Available') {
      addToast('error', 'Batch Unavailable', `This donation is already in "${donation.status}" status.`);
      return false;
    }

    // Call atomic Firestore transaction
    const res = await claimDonationWithTransaction(
      donationId,
      ngoId,
      ngoName,
      actorName || currentUser?.displayName || 'Authorized Coordinator'
    );

    if (res.success) {
      // Optimistic update
      const nowIso = new Date().toISOString();
      const historyEntry: StatusHistoryEntry = {
        id: 'hist-' + Math.random().toString(36).substring(2, 7),
        status: 'Claimed',
        timestamp: nowIso,
        actor: `${ngoName} [${actorName || currentUser?.displayName || 'Coordinator'}]`,
        notes: 'Batch claimed via atomic Firestore transaction.',
      };
      setDonations((prev) =>
        prev.map((d) =>
          d.id === donationId
            ? {
                ...d,
                status: 'Claimed',
                claimedByNgoId: ngoId,
                claimedByNgoName: ngoName,
                claimedAt: nowIso,
                statusHistory: [...(d.statusHistory || []), historyEntry],
              }
            : d
        )
      );
      addToast('success', 'Donation Claimed!', `${ngoName} reserved ${donation.quantityMeals} meals.`);
      return true;
    } else {
      addToast('error', 'Claim Transaction Rejected', res.message);
      return false;
    }
  };

  /**
   * ATOMIC FIRESTORE COURIER DISPATCH
   */
  const assignVolunteer = async (
    donationId: string,
    volunteerId: string,
    volunteerName: string,
    actorName?: string
  ): Promise<boolean> => {
    const donation = donations.find((d) => d.id === donationId);
    if (!donation) {
      addToast('error', 'Dispatch Error', 'Donation not found.');
      return false;
    }

    const res = await assignVolunteerWithTransaction(
      donationId,
      volunteerId,
      volunteerName,
      actorName || currentUser?.displayName || 'Dispatcher'
    );

    if (res.success) {
      const nowIso = new Date().toISOString();
      const historyEntry: StatusHistoryEntry = {
        id: 'hist-' + Math.random().toString(36).substring(2, 7),
        status: donation.status,
        timestamp: nowIso,
        actor: actorName || currentUser?.displayName || 'Dispatcher',
        notes: `Courier ${volunteerName} assigned for insulated transport.`,
      };
      setDonations((prev) =>
        prev.map((d) =>
          d.id === donationId
            ? {
                ...d,
                assignedVolunteerId: volunteerId,
                assignedVolunteerName: volunteerName,
                statusHistory: [...(d.statusHistory || []), historyEntry],
              }
            : d
        )
      );
      setVolunteers((prev) =>
        prev.map((v) =>
          v.id === volunteerId ? { ...v, status: 'On Delivery', currentDonationId: donationId } : v
        )
      );
      addToast('success', 'Courier Dispatched', `${volunteerName} assigned to route.`);
      return true;
    } else {
      addToast('error', 'Dispatch Rejected', res.message);
      return false;
    }
  };

  /**
   * ATOMIC TRANSITIONS: Picked Up, Completed, Cancelled
   */
  const markDonationPickedUp = async (donationId: string, actorName?: string): Promise<boolean> => {
    const res = await transitionDonationStatusWithTransaction(
      donationId,
      'Picked Up',
      actorName || currentUser?.displayName || 'Volunteer Courier',
      'Food collected and loaded into insulated vehicle container.'
    );
    if (res.success) {
      setDonations((prev) =>
        prev.map((d) => (d.id === donationId ? { ...d, status: 'Picked Up', pickedUpAt: new Date().toISOString() } : d))
      );
      addToast('info', 'Status: Picked Up', 'Food is currently in transit to recipient shelter.');
      return true;
    }
    addToast('error', 'Update Failed', res.message);
    return false;
  };

  const markDonationCompleted = async (
    donationId: string,
    actorName?: string,
    notes?: string
  ): Promise<boolean> => {
    const res = await transitionDonationStatusWithTransaction(
      donationId,
      'Completed',
      actorName || currentUser?.displayName || 'Shelter Intake Officer',
      notes || 'Meal redistribution handover successfully fulfilled.'
    );
    if (res.success) {
      setDonations((prev) =>
        prev.map((d) => (d.id === donationId ? { ...d, status: 'Completed', completedAt: new Date().toISOString() } : d))
      );
      addToast('success', 'Redistribution Completed!', 'Meals successfully delivered to beneficiaries.');
      return true;
    }
    addToast('error', 'Completion Failed', res.message);
    return false;
  };

  const cancelDonation = async (
    donationId: string,
    reason: string,
    actorName?: string
  ): Promise<boolean> => {
    const res = await transitionDonationStatusWithTransaction(
      donationId,
      'Cancelled',
      actorName || currentUser?.displayName || 'Administrator',
      `Cancelled: ${reason}`
    );
    if (res.success) {
      setDonations((prev) =>
        prev.map((d) => (d.id === donationId ? { ...d, status: 'Cancelled', cancellationReason: reason } : d))
      );
      addToast('warning', 'Donation Cancelled', 'Batch status updated to Cancelled.');
      return true;
    }
    addToast('error', 'Cancellation Failed', res.message);
    return false;
  };

  // ==========================================
  // NGO OPERATIONS
  // ==========================================

  const addNGO = async (ngoData: Omit<NGO, 'id' | 'createdAt'>): Promise<NGO> => {
    try {
      const created = await createNGOInFirestore(ngoData);
      setNgos((prev) => [...prev, created]);
      addToast('success', 'NGO Partner Registered', `${created.name} registered successfully.`);
      return created;
    } catch {
      const newId = 'ngo-' + Math.random().toString(36).substring(2, 8);
      const fallback: NGO = { ...ngoData, id: newId, createdAt: new Date().toISOString() };
      setNgos((prev) => [...prev, fallback]);
      addToast('success', 'NGO Registered', `${fallback.name} added.`);
      return fallback;
    }
  };

  const toggleNGOAvailability = async (id: string) => {
    const ngo = ngos.find((n) => n.id === id);
    if (!ngo) return;
    const updated = !ngo.isAvailable;
    try {
      await updateNGOInFirestore(id, { isAvailable: updated });
    } catch {}
    setNgos((prev) => prev.map((n) => (n.id === id ? { ...n, isAvailable: updated } : n)));
    addToast('info', 'Intake Status Updated', `${ngo.name} intake is now ${updated ? 'Active' : 'Paused'}.`);
  };

  const updateNGOCapacity = async (id: string, newCapacity: number) => {
    try {
      await updateNGOInFirestore(id, { maxReceivingCapacity: newCapacity });
    } catch {}
    setNgos((prev) => prev.map((n) => (n.id === id ? { ...n, maxReceivingCapacity: newCapacity } : n)));
    addToast('success', 'Capacity Updated', `Intake ceiling adjusted to ${newCapacity} meals.`);
  };

  const toggleNGOVerification = async (id: string) => {
    const ngo = ngos.find((n) => n.id === id);
    if (!ngo) return;
    const updated = !ngo.isVerified;
    try {
      await updateNGOInFirestore(id, { isVerified: updated });
    } catch {}
    setNgos((prev) => prev.map((n) => (n.id === id ? { ...n, isVerified: updated } : n)));
    addToast('success', 'Verification Updated', `${ngo.name} verification status updated.`);
  };

  // ==========================================
  // VOLUNTEER OPERATIONS
  // ==========================================

  const addVolunteer = async (
    volData: Omit<Volunteer, 'id' | 'createdAt' | 'completedDeliveriesCount'>
  ): Promise<Volunteer> => {
    try {
      const created = await createVolunteerInFirestore(volData);
      setVolunteers((prev) => [...prev, created]);
      addToast('success', 'Volunteer Registered', `${created.name} joined the courier fleet.`);
      return created;
    } catch {
      const newId = 'vol-' + Math.random().toString(36).substring(2, 8);
      const fallback: Volunteer = {
        ...volData,
        id: newId,
        completedDeliveriesCount: 0,
        createdAt: new Date().toISOString(),
      };
      setVolunteers((prev) => [...prev, fallback]);
      addToast('success', 'Volunteer Registered', `${fallback.name} added.`);
      return fallback;
    }
  };

  const updateVolunteerStatus = async (id: string, status: Volunteer['status']) => {
    try {
      await updateVolunteerInFirestore(id, { status });
    } catch {}
    setVolunteers((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
    addToast('info', 'Courier Status', `Status updated to ${status}.`);
  };

  // ==========================================
  // GUIDED DEMONSTRATION WORKFLOW
  // ==========================================

  const startGuidedDemo = () => {
    setDemoStep(1);
    setCurrentRole('donor');
    setActiveTab('overview');
    addToast(
      'info',
      'Step 1/9: Demonstration Initialized',
      'Operating as Food Donor. Surplus food dashboard ready.'
    );
  };

  const advanceDemoStep = () => {
    const next = demoStep + 1;
    if (next === 2) {
      setCurrentRole('donor');
      setActiveTab('donations');
      addToast('info', 'Step 2/9: Food Listing', 'Review listed surplus food and safety specifications.');
    } else if (next === 3) {
      const target = donations.find((d) => d.status === 'Available') || donations[0];
      setSelectedDonationForMatch(target);
      setActiveTab('find-food');
      addToast('info', 'Step 3/9: Matching Engine', 'Transparent deterministic scoring ranking compatible NGOs.');
    } else if (next === 4) {
      setCurrentRole('ngo');
      setActiveTab('overview');
      addToast('info', 'Step 4/9: NGO View', 'Operating as NGO recipient partner. Inspecting intake capacity.');
    } else if (next === 5) {
      const target = donations.find((d) => d.status === 'Available') || donations[0];
      const targetNgo = ngos[0];
      if (target && targetNgo) {
        claimDonation(target.id, targetNgo.id, targetNgo.name);
      }
      setActiveTab('overview');
      addToast('success', 'Step 5/9: Claim Locked', 'Surplus batch reserved via atomic transaction.');
    } else if (next === 6) {
      setCurrentRole('admin');
      setActiveTab('volunteers');
      addToast('info', 'Step 6/9: Courier Dispatch', 'Dispatching available insulated delivery courier.');
    } else if (next === 7) {
      setCurrentRole('volunteer');
      const target = donations.find((d) => d.status === 'Claimed') || donations[0];
      if (target) {
        markDonationPickedUp(target.id, 'Alex Rivera (Two-Wheeler)');
      }
      setActiveTab('overview');
      addToast('info', 'Step 7/9: Pickup Confirmed', 'Food in transit under insulated thermal holding.');
    } else if (next === 8) {
      setCurrentRole('ngo');
      const target = donations.find((d) => d.status === 'Picked Up') || donations[0];
      if (target) {
        markDonationCompleted(target.id, 'Asha Shelter Coordinator', 'Thermal checks verified. 100 meals served.');
      }
      setActiveTab('overview');
      addToast('success', 'Step 8/9: Mission Completed', 'Meals redistributed and hunger alleviated!');
    } else if (next === 9) {
      setCurrentRole('admin');
      setActiveTab('analytics');
      addToast('success', 'Step 9/9: Impact Verified', 'Inspect live analytics: CO2 prevented and water conserved.');
    } else {
      setDemoStep(0);
      addToast('success', 'Demonstration Complete', 'Full FoodBridge AI lifecycle walked through successfully!');
      return;
    }
    setDemoStep(next);
  };

  const skipDemoStep = () => {
    advanceDemoStep();
  };

  const exitGuidedDemo = () => {
    setDemoStep(0);
    addToast('info', 'Demo Mode Exited', 'Returning to standard operational view.');
  };

  const resetDemoData = () => {
    setDonations(INITIAL_DONATIONS);
    setNgos(INITIAL_NGOS);
    setVolunteers(INITIAL_VOLUNTEERS);
    try {
      localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(INITIAL_DONATIONS));
      localStorage.setItem(STORAGE_KEYS.NGOS, JSON.stringify(INITIAL_NGOS));
      localStorage.setItem(STORAGE_KEYS.VOLUNTEERS, JSON.stringify(INITIAL_VOLUNTEERS));
    } catch {}
    setDemoStep(0);
    addToast('info', 'Demo State Reset', 'Initial baseline scenario data reloaded.');
  };

  // ==========================================
  // COMPUTED ANALYTICS & STATS
  // ==========================================

  const stats = useMemo(() => {
    const totalMealsListed = donations.reduce((sum, d) => sum + (d.quantityMeals || 0), 0);

    const now = Date.now();
    const availableMeals = donations
      .filter((d) => {
        if (d.status !== 'Available') return false;
        const deadline = new Date(d.collectionDeadline).getTime();
        return deadline > now;
      })
      .reduce((sum, d) => sum + (d.quantityMeals || 0), 0);

    const activeDonationsCount = donations.filter((d) =>
      ['Available', 'Claimed', 'Picked Up'].includes(d.status)
    ).length;

    const registeredNGOsCount = ngos.length;

    const completedDonations = donations.filter((d) => d.status === 'Completed');
    const completedDonationsCount = completedDonations.length;

    const expiredDonationsCount = donations.filter((d) => d.status === 'Expired').length;
    const cancelledDonationsCount = donations.filter((d) => d.status === 'Cancelled').length;

    const mealsRedistributed = completedDonations.reduce(
      (sum, d) => sum + (d.quantityMeals || 0),
      0
    );

    const donorSet = new Set(donations.map((d) => d.donorName));
    const activeDonorsCount = donorSet.size;

    const participatingNgos = new Set(
      donations
        .filter((d) => d.claimedByNgoId && ['Claimed', 'Picked Up', 'Completed'].includes(d.status))
        .map((d) => d.claimedByNgoId)
    );
    const ngosActiveCount = participatingNgos.size;

    const pickupDurations: number[] = [];
    donations.forEach((d) => {
      if (d.pickedUpAt && d.claimedAt) {
        const diff = (new Date(d.pickedUpAt).getTime() - new Date(d.claimedAt).getTime()) / 60000;
        if (diff > 0 && diff < 1440) {
          pickupDurations.push(diff);
        }
      }
    });
    const averagePickupMinutes =
      pickupDurations.length > 0
        ? Math.round(pickupDurations.reduce((a, b) => a + b, 0) / pickupDurations.length)
        : 45;

    const foodKgPrevented = mealsRedistributed * 0.42;
    const co2KgSaved = Math.round(foodKgPrevented * 2.5);
    const waterLitersSaved = Math.round(foodKgPrevented * 650);

    return {
      totalMealsListed,
      availableMeals,
      activeDonationsCount,
      registeredNGOsCount,
      mealsRedistributed,
      completedDonationsCount,
      expiredDonationsCount,
      cancelledDonationsCount,
      activeDonorsCount,
      ngosActiveCount,
      averagePickupMinutes,
      co2KgSaved,
      waterLitersSaved,
    };
  }, [donations, ngos]);

  const { urgentDonations, expiredDonations } = useMemo(() => {
    const now = Date.now();
    const fourHoursFromNow = now + 4 * 60 * 60 * 1000;

    const urgent: FoodDonation[] = [];
    const expired: FoodDonation[] = [];

    donations.forEach((d) => {
      const deadline = new Date(d.collectionDeadline).getTime();
      if (d.status === 'Expired' || (deadline <= now && d.status === 'Available')) {
        expired.push(d);
      } else if (
        (d.status === 'Available' || d.status === 'Claimed') &&
        deadline > now &&
        deadline <= fourHoursFromNow
      ) {
        urgent.push(d);
      }
    });

    return { urgentDonations: urgent, expiredDonations: expired };
  }, [donations]);

  return (
    <AppContext.Provider
      value={{
        donations,
        ngos,
        volunteers,
        activeTab,
        setActiveTab,
        currentRole,
        setCurrentRole,
        selectedDonationForMatch,
        setSelectedDonationForMatch,

        currentUser,
        isAuthLoading,
        signInWithGoogle,
        signInAsDemoRole,
        registerUserWithProfile,
        signOutUser,
        isFirestoreConnected,

        addDonation,
        updateDonation,
        deleteDonation,
        claimDonation,
        assignVolunteer,
        markDonationPickedUp,
        markDonationCompleted,
        cancelDonation,

        addNGO,
        toggleNGOAvailability,
        updateNGOCapacity,
        toggleNGOVerification,

        addVolunteer,
        updateVolunteerStatus,

        toasts,
        addToast,
        removeToast,

        demoStep,
        isDemoActive,
        startGuidedDemo,
        advanceDemoStep,
        skipDemoStep,
        exitGuidedDemo,
        resetDemoData,

        stats,
        urgentDonations,
        expiredDonations,

        getNGORemainingCapacity,
        getNGOCommittedMeals,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
