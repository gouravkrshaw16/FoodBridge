import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  FoodDonation,
  NGO,
  Volunteer,
  StatusHistoryEntry,
  UserRole,
} from '../types';
import { UserProfileFormData } from '../schemas/validationSchemas';
import { INITIAL_DONATIONS, INITIAL_NGOS, INITIAL_VOLUNTEERS } from '../data/initialData';

const COLLECTIONS = {
  USERS: 'users',
  DONATIONS: 'donations',
  NGOS: 'ngos',
  VOLUNTEERS: 'volunteers',
  ADMINS: 'admins',
};

// ==========================================
// 1. USER PROFILES & AUTH SERVICE
// ==========================================

export async function getUserProfile(uid: string): Promise<UserProfileFormData | null> {
  const path = `${COLLECTIONS.USERS}/${uid}`;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (snap.exists()) {
      return snap.data() as UserProfileFormData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfileFormData): Promise<void> {
  const path = `${COLLECTIONS.USERS}/${profile.uid}`;
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, profile.uid), {
      ...profile,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUsers(
  onUpdate: (users: UserProfileFormData[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.USERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as UserProfileFormData);
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.USERS);
      } catch (err) {
        console.warn('Users listener sync error:', err);
      }
    }
  );
}

// ==========================================
// 2. DONATIONS REAL-TIME SYNC & TRANSACTIONS
// ==========================================

export function subscribeToDonations(
  onUpdate: (donations: FoodDonation[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.DONATIONS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
        } as FoodDonation;
      });
      // Sort newest first in memory
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.DONATIONS);
      } catch (err) {
        console.warn('Donations listener sync error:', err);
      }
    }
  );
}

export async function createDonationInFirestore(
  donationData: Omit<FoodDonation, 'id' | 'createdAt' | 'status' | 'statusHistory'>
): Promise<FoodDonation> {
  const nowIso = new Date().toISOString();
  const newId = 'don-' + Math.random().toString(36).substring(2, 9);

  const initialHistory: StatusHistoryEntry = {
    id: 'hist-' + Math.random().toString(36).substring(2, 8),
    status: 'Available',
    timestamp: nowIso,
    actor: `${donationData.donorName} (${donationData.donorType})`,
    notes: 'Surplus food batch recorded to live Cloud Firestore database.',
  };

  const newDoc: FoodDonation = {
    ...donationData,
    id: newId,
    status: 'Available',
    createdAt: nowIso,
    statusHistory: [initialHistory],
  };

  const path = `${COLLECTIONS.DONATIONS}/${newId}`;
  try {
    await setDoc(doc(db, COLLECTIONS.DONATIONS, newId), {
      ...newDoc,
      serverCreatedAt: serverTimestamp(),
    });
    return newDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateDonationInFirestore(
  id: string,
  updates: Partial<FoodDonation>
): Promise<void> {
  const path = `${COLLECTIONS.DONATIONS}/${id}`;
  try {
    await updateDoc(doc(db, COLLECTIONS.DONATIONS, id), {
      ...updates,
      serverUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDonationInFirestore(id: string): Promise<void> {
  const path = `${COLLECTIONS.DONATIONS}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.DONATIONS, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * ATOMIC FIRESTORE TRANSACTION: Claim Donation
 * - Prevents duplicate donation claims across concurrent users
 * - Validates capacity limits in real time
 */
export async function claimDonationWithTransaction(
  donationId: string,
  ngoId: string,
  ngoName: string,
  actorName: string = 'Authorized NGO Coordinator'
): Promise<{ success: boolean; message: string }> {
  const donationRef = doc(db, COLLECTIONS.DONATIONS, donationId);
  const ngoRef = doc(db, COLLECTIONS.NGOS, ngoId);

  try {
    await runTransaction(db, async (transaction) => {
      const donationSnap = await transaction.get(donationRef);
      if (!donationSnap.exists()) {
        throw new Error('Donation record was not found in the database.');
      }

      const donationData = donationSnap.data() as FoodDonation;
      if (donationData.status !== 'Available') {
        throw new Error(
          `Cannot claim donation: this batch is currently in '${donationData.status}' status (already claimed or expired).`
        );
      }

      // Check NGO details and capacity limit
      const ngoSnap = await transaction.get(ngoRef);
      if (ngoSnap.exists()) {
        const ngoData = ngoSnap.data() as NGO;
        if (!ngoData.isAvailable) {
          throw new Error('Selected NGO partner is currently marked as unavailable for intake.');
        }
        // Enforce capacity bounds
        if (donationData.quantityMeals > ngoData.maxReceivingCapacity) {
          throw new Error(
            `Donation quantity (${donationData.quantityMeals} meals) exceeds NGO intake ceiling (${ngoData.maxReceivingCapacity} meals).`
          );
        }
      }

      const nowIso = new Date().toISOString();
      const historyEntry: StatusHistoryEntry = {
        id: 'hist-claim-' + Math.random().toString(36).substring(2, 7),
        status: 'Claimed',
        timestamp: nowIso,
        actor: `${ngoName} [${actorName}]`,
        notes: `Batch reserved via verified atomic Firestore transaction.`,
      };

      const updatedHistory = [...(donationData.statusHistory || []), historyEntry];

      transaction.update(donationRef, {
        status: 'Claimed',
        claimedByNgoId: ngoId,
        claimedByNgoName: ngoName,
        claimedAt: nowIso,
        statusHistory: updatedHistory,
        serverClaimedAt: serverTimestamp(),
      });
    });

    return { success: true, message: 'Donation successfully claimed and locked!' };
  } catch (error) {
    console.error('Claim Transaction Failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Transaction failed to claim donation.',
    };
  }
}

/**
 * ATOMIC FIRESTORE TRANSACTION: Assign Courier Volunteer
 */
export async function assignVolunteerWithTransaction(
  donationId: string,
  volunteerId: string,
  volunteerName: string,
  actorName: string = 'Dispatcher'
): Promise<{ success: boolean; message: string }> {
  const donationRef = doc(db, COLLECTIONS.DONATIONS, donationId);
  const volunteerRef = doc(db, COLLECTIONS.VOLUNTEERS, volunteerId);

  try {
    await runTransaction(db, async (transaction) => {
      const donSnap = await transaction.get(donationRef);
      if (!donSnap.exists()) {
        throw new Error('Donation record not found.');
      }
      const donData = donSnap.data() as FoodDonation;
      if (donData.status !== 'Claimed') {
        throw new Error(`Volunteer dispatch requires donation to be in 'Claimed' status. Current: ${donData.status}`);
      }

      const volSnap = await transaction.get(volunteerRef);
      if (!volSnap.exists()) {
        throw new Error('Volunteer record not found.');
      }
      const volData = volSnap.data() as Volunteer;
      if (volData.status === 'On Delivery') {
        throw new Error(`Volunteer ${volunteerName} is already occupied on an active delivery route.`);
      }

      const nowIso = new Date().toISOString();
      const historyEntry: StatusHistoryEntry = {
        id: 'hist-assign-' + Math.random().toString(36).substring(2, 7),
        status: 'Claimed',
        timestamp: nowIso,
        actor: actorName,
        notes: `Assigned courier ${volunteerName} (${volData.vehicleType}) for refrigerated transit.`,
      };

      transaction.update(donationRef, {
        assignedVolunteerId: volunteerId,
        assignedVolunteerName: volunteerName,
        statusHistory: [...(donData.statusHistory || []), historyEntry],
        serverAssignedAt: serverTimestamp(),
      });

      transaction.update(volunteerRef, {
        status: 'On Delivery',
        currentDonationId: donationId,
        serverUpdatedAt: serverTimestamp(),
      });
    });

    return { success: true, message: `Courier ${volunteerName} successfully assigned.` };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to assign courier.',
    };
  }
}

/**
 * ATOMIC STATUS TRANSITION: Pickup or Complete or Cancel
 */
export async function transitionDonationStatusWithTransaction(
  donationId: string,
  newStatus: 'Picked Up' | 'Completed' | 'Cancelled',
  actorName: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  const donationRef = doc(db, COLLECTIONS.DONATIONS, donationId);

  try {
    await runTransaction(db, async (transaction) => {
      const donSnap = await transaction.get(donationRef);
      if (!donSnap.exists()) {
        throw new Error('Donation document not found.');
      }
      const donData = donSnap.data() as FoodDonation;

      const nowIso = new Date().toISOString();
      const updates: Record<string, unknown> = {
        status: newStatus,
        serverUpdatedAt: serverTimestamp(),
      };

      if (newStatus === 'Picked Up') {
        if (donData.status !== 'Claimed') {
          throw new Error(`Pickup requires batch to be 'Claimed'. Current: ${donData.status}`);
        }
        updates.pickedUpAt = nowIso;
      } else if (newStatus === 'Completed') {
        if (donData.status !== 'Picked Up' && donData.status !== 'Claimed') {
          throw new Error(`Completion requires batch to be 'Picked Up' or 'Claimed'. Current: ${donData.status}`);
        }
        updates.completedAt = nowIso;

        // Release assigned volunteer
        if (donData.assignedVolunteerId) {
          const volRef = doc(db, COLLECTIONS.VOLUNTEERS, donData.assignedVolunteerId);
          const volSnap = await transaction.get(volRef);
          if (volSnap.exists()) {
            const volData = volSnap.data() as Volunteer;
            transaction.update(volRef, {
              status: 'Available',
              currentDonationId: '',
              completedDeliveriesCount: (volData.completedDeliveriesCount || 0) + 1,
            });
          }
        }
      } else if (newStatus === 'Cancelled') {
        updates.cancelledAt = nowIso;
        updates.cancellationReason = notes || 'Administrative cancellation';

        // Release assigned volunteer if any
        if (donData.assignedVolunteerId) {
          const volRef = doc(db, COLLECTIONS.VOLUNTEERS, donData.assignedVolunteerId);
          const volSnap = await transaction.get(volRef);
          if (volSnap.exists()) {
            transaction.update(volRef, {
              status: 'Available',
              currentDonationId: '',
            });
          }
        }
      }

      const historyEntry: StatusHistoryEntry = {
        id: 'hist-' + Math.random().toString(36).substring(2, 7),
        status: newStatus,
        timestamp: nowIso,
        actor: actorName,
        notes: notes || `Batch status updated to ${newStatus}.`,
      };

      updates.statusHistory = [...(donData.statusHistory || []), historyEntry];
      transaction.update(donationRef, updates);
    });

    return { success: true, message: `Status updated to '${newStatus}' successfully.` };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Status transition failed.',
    };
  }
}

// ==========================================
// 3. NGOS REAL-TIME SYNC & OPERATIONS
// ==========================================

export function subscribeToNGOs(
  onUpdate: (ngos: NGO[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.NGOS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
      })) as NGO[];
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.NGOS);
      } catch (err) {
        console.warn('NGOs listener sync error:', err);
      }
    }
  );
}

export async function createNGOInFirestore(ngoData: Omit<NGO, 'id' | 'createdAt'>): Promise<NGO> {
  const newId = 'ngo-' + Math.random().toString(36).substring(2, 8);
  const newNgo: NGO = {
    ...ngoData,
    id: newId,
    createdAt: new Date().toISOString(),
  };

  const path = `${COLLECTIONS.NGOS}/${newId}`;
  try {
    await setDoc(doc(db, COLLECTIONS.NGOS, newId), {
      ...newNgo,
      serverCreatedAt: serverTimestamp(),
    });
    return newNgo;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateNGOInFirestore(id: string, updates: Partial<NGO>): Promise<void> {
  const path = `${COLLECTIONS.NGOS}/${id}`;
  try {
    await updateDoc(doc(db, COLLECTIONS.NGOS, id), {
      ...updates,
      serverUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==========================================
// 4. VOLUNTEERS REAL-TIME SYNC & OPERATIONS
// ==========================================

export function subscribeToVolunteers(
  onUpdate: (volunteers: Volunteer[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.VOLUNTEERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
      })) as Volunteer[];
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.VOLUNTEERS);
      } catch (err) {
        console.warn('Volunteers listener sync error:', err);
      }
    }
  );
}

export async function createVolunteerInFirestore(
  volData: Omit<Volunteer, 'id' | 'createdAt' | 'completedDeliveriesCount'>
): Promise<Volunteer> {
  const newId = 'vol-' + Math.random().toString(36).substring(2, 8);
  const newVol: Volunteer = {
    ...volData,
    id: newId,
    completedDeliveriesCount: 0,
    createdAt: new Date().toISOString(),
  };

  const path = `${COLLECTIONS.VOLUNTEERS}/${newId}`;
  try {
    await setDoc(doc(db, COLLECTIONS.VOLUNTEERS, newId), {
      ...newVol,
      serverCreatedAt: serverTimestamp(),
    });
    return newVol;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateVolunteerInFirestore(id: string, updates: Partial<Volunteer>): Promise<void> {
  const path = `${COLLECTIONS.VOLUNTEERS}/${id}`;
  try {
    await updateDoc(doc(db, COLLECTIONS.VOLUNTEERS, id), {
      ...updates,
      serverUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==========================================
// 5. SAFE DEMO DATA MIGRATION STRATEGY
// ==========================================

export async function checkAndMigrateDemoData(force: boolean = false): Promise<{
  migrated: boolean;
  donationsCount: number;
  ngosCount: number;
  volunteersCount: number;
}> {
  try {
    const [donSnap, ngoSnap, volSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.DONATIONS)),
      getDocs(collection(db, COLLECTIONS.NGOS)),
      getDocs(collection(db, COLLECTIONS.VOLUNTEERS)),
    ]);

    const isFirestoreEmpty = donSnap.empty && ngoSnap.empty && volSnap.empty;

    if (!isFirestoreEmpty && !force) {
      return {
        migrated: false,
        donationsCount: donSnap.size,
        ngosCount: ngoSnap.size,
        volunteersCount: volSnap.size,
      };
    }

    // Populate initial seed data safely without destructive overwrite
    const donPromises = INITIAL_DONATIONS.map((d) =>
      setDoc(doc(db, COLLECTIONS.DONATIONS, d.id), {
        ...d,
        serverCreatedAt: serverTimestamp(),
      })
    );

    const ngoPromises = INITIAL_NGOS.map((n) =>
      setDoc(doc(db, COLLECTIONS.NGOS, n.id), {
        ...n,
        serverCreatedAt: serverTimestamp(),
      })
    );

    const volPromises = INITIAL_VOLUNTEERS.map((v) =>
      setDoc(doc(db, COLLECTIONS.VOLUNTEERS, v.id), {
        ...v,
        serverCreatedAt: serverTimestamp(),
      })
    );

    await Promise.all([...donPromises, ...ngoPromises, ...volPromises]);

    return {
      migrated: true,
      donationsCount: INITIAL_DONATIONS.length,
      ngosCount: INITIAL_NGOS.length,
      volunteersCount: INITIAL_VOLUNTEERS.length,
    };
  } catch (error) {
    console.error('Error during demo data migration to Firestore:', error);
    return {
      migrated: false,
      donationsCount: 0,
      ngosCount: 0,
      volunteersCount: 0,
    };
  }
}
