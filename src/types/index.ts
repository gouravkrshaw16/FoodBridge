export type DonationStatus =
  | 'Available'
  | 'Claimed'
  | 'Picked Up'
  | 'Completed'
  | 'Cancelled'
  | 'Expired';

export type DonorType =
  | 'Restaurant'
  | 'College Canteen'
  | 'Hostel'
  | 'Hotel'
  | 'Event Organizer'
  | 'Individual Donor';

export type FoodCategory =
  | 'Cooked Meals'
  | 'Fruits'
  | 'Vegetables'
  | 'Bakery Items'
  | 'Packaged Food'
  | 'Other';

export type StorageRequirement =
  | 'Room Temperature'
  | 'Refrigerated (< 4°C)'
  | 'Keep Warm (> 60°C)'
  | 'Frozen (< -18°C)'
  | 'Dry Storage';

export type QuantityUnit =
  | 'Meals / Servings'
  | 'Kilograms (kg)'
  | 'Trays'
  | 'Boxes / Crates'
  | 'Packages';

export interface StatusHistoryEntry {
  id: string;
  status: DonationStatus;
  timestamp: string; // ISO string
  actor: string; // Who performed the transition
  notes?: string;
}

export interface FoodDonation {
  id: string;
  foodName: string;
  category: FoodCategory;
  isVegetarian: boolean;
  quantity: number;
  quantityUnit: QuantityUnit;
  quantityMeals: number; // Normalized estimated meals
  donorName: string;
  donorType: DonorType;
  pickupLocation: string;
  donorContact: string;
  preparationTime: string; // ISO string
  collectionDeadline: string; // ISO string
  storageRequirement: StorageRequirement;
  temperatureRequirement?: string;
  allergens?: string;
  dietaryRestrictions?: string[];
  additionalNotes?: string;
  specialHandlingInstructions?: string;
  safetyConfirmedByDonor: boolean;
  
  status: DonationStatus;
  claimedByNgoId?: string;
  claimedByNgoName?: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  
  createdAt: string;
  claimedAt?: string;
  pickedUpAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  statusHistory: StatusHistoryEntry[];
}

export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface NGO {
  id: string;
  name: string;
  location: string;
  serviceArea: string;
  simulatedDistanceKm: number; // in km from central demo cluster
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  mealsRequired: number; // daily demand
  maxReceivingCapacity: number; // peak ceiling in meals
  acceptedCategories: FoodCategory[];
  acceptsNonVeg: boolean;
  urgency: UrgencyLevel;
  isAvailable: boolean;
  isVerified: boolean;
  operatingHours: string;
  beneficiaryDescription: string;
  createdAt: string;
}

export type VolunteerStatus = 'Available' | 'On Delivery' | 'Off Duty';

export type AssignmentStatus =
  | 'Assigned'
  | 'Pickup In Progress'
  | 'Delivered'
  | 'Cancelled';

export interface Volunteer {
  id: string;
  name: string;
  contactPhone: string;
  contactEmail: string;
  serviceArea: string;
  vehicleType: 'Two-Wheeler' | 'Car / Van' | 'Bicycle' | 'Electric Cargo';
  status: VolunteerStatus;
  currentDonationId?: string;
  completedDeliveriesCount: number;
  isVerified: boolean;
  createdAt: string;
}

export interface MatchScoreBreakdown {
  distanceScore: number; // max 30
  urgencyScore: number; // max 25
  quantityScore: number; // max 25
  categoryScore: number; // max 10
  capacityScore: number; // max 10
  totalScore: number; // max 100
  explanations: string[];
  isCompatible: boolean;
  incompatibilityReason?: string;
  remainingCapacityAfter: number;
}

export interface MatchResult {
  ngo: NGO;
  scoreBreakdown: MatchScoreBreakdown;
  remainingCapacity: number;
  committedMeals: number;
}

export type ActiveTab =
  | 'overview'
  | 'donations'
  | 'find-food'
  | 'ngos'
  | 'volunteers'
  | 'analytics'
  | 'assistant'
  | 'settings';

export type UserRole = 'donor' | 'ngo' | 'volunteer' | 'admin';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface DemoStep {
  stepNumber: number;
  title: string;
  description: string;
  role: UserRole;
  targetTab: ActiveTab;
  actionLabel: string;
  expectedState: string;
  isComplete: boolean;
}
