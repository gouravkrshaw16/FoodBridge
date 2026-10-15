import { z } from 'zod';
import { FoodCategory, StorageRequirement, QuantityUnit, DonorType, UrgencyLevel } from '../types';

export const FOOD_CATEGORIES: [FoodCategory, ...FoodCategory[]] = [
  'Cooked Meals',
  'Fruits',
  'Vegetables',
  'Bakery Items',
  'Packaged Food',
  'Other',
];

export const STORAGE_REQUIREMENTS: [StorageRequirement, ...StorageRequirement[]] = [
  'Room Temperature',
  'Refrigerated (< 4°C)',
  'Keep Warm (> 60°C)',
  'Frozen (< -18°C)',
  'Dry Storage',
];

export const QUANTITY_UNITS: [QuantityUnit, ...QuantityUnit[]] = [
  'Meals / Servings',
  'Kilograms (kg)',
  'Trays',
  'Boxes / Crates',
  'Packages',
];

export const DONOR_TYPES: [DonorType, ...DonorType[]] = [
  'Restaurant',
  'College Canteen',
  'Hostel',
  'Hotel',
  'Event Organizer',
  'Individual Donor',
];

export const URGENCY_LEVELS: [UrgencyLevel, ...UrgencyLevel[]] = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

// 1. Food Donation Schema
export const foodDonationSchema = z
  .object({
    foodName: z
      .string()
      .min(3, 'Food description must be at least 3 characters')
      .max(128, 'Food description cannot exceed 128 characters'),
    category: z.enum(FOOD_CATEGORIES, {
      message: 'Please select a valid food category',
    }),
    isVegetarian: z.boolean(),
    quantity: z
      .number({ message: 'Quantity must be a valid number' })
      .positive('Quantity must be greater than zero')
      .max(10000, 'Batch size exceeds allowable limits'),
    quantityUnit: z.enum(QUANTITY_UNITS),
    quantityMeals: z
      .number({ message: 'Estimated servings must be a valid number' })
      .positive('Estimated meals must be greater than zero'),
    donorName: z
      .string()
      .min(2, 'Donor organization name is required')
      .max(128, 'Donor name too long'),
    donorType: z.enum(DONOR_TYPES),
    pickupLocation: z
      .string()
      .min(5, 'Specific street pickup address is required')
      .max(256, 'Address too long'),
    donorContact: z
      .string()
      .min(5, 'Valid coordinator contact details required')
      .max(64, 'Contact info too long'),
    preparationTime: z.string().min(1, 'Preparation timestamp is required'),
    collectionDeadline: z.string().min(1, 'Collection cutoff deadline is required'),
    storageRequirement: z.enum(STORAGE_REQUIREMENTS),
    temperatureRequirement: z.string().max(128).optional(),
    allergens: z.string().max(256).optional(),
    dietaryRestrictions: z.array(z.string()),
    specialHandlingInstructions: z.string().max(256).optional(),
    additionalNotes: z.string().max(512).optional(),
    safetyConfirmedByDonor: z.boolean().refine((v) => v === true, {
      message: 'You must certify safe sanitary preparation and thermal holding compliance',
    }),
  })
  .refine(
    (data) => {
      const prepEpoch = new Date(data.preparationTime).getTime();
      const deadlineEpoch = new Date(data.collectionDeadline).getTime();
      if (isNaN(prepEpoch) || isNaN(deadlineEpoch)) return false;
      return deadlineEpoch > prepEpoch;
    },
    {
      message: 'Collection deadline must be scheduled after preparation time',
      path: ['collectionDeadline'],
    }
  );

export type FoodDonationFormData = z.infer<typeof foodDonationSchema>;

// 2. NGO Registration Schema
export const ngoRegistrationSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Organization name must be at least 3 characters')
      .max(128, 'Organization name too long'),
    location: z
      .string()
      .min(5, 'Operating address or shelter location is required')
      .max(256, 'Address too long'),
    serviceArea: z
      .string()
      .min(2, 'Service district or radius is required')
      .max(128, 'Service area too long'),
    simulatedDistanceKm: z
      .number()
      .min(0.1, 'Distance must be positive')
      .max(100, 'Distance out of local range'),
    contactPerson: z
      .string()
      .min(2, 'Coordinator name is required')
      .max(128, 'Name too long'),
    contactPhone: z
      .string()
      .min(6, 'Valid phone number is required')
      .max(64, 'Phone number too long'),
    contactEmail: z.string().email('Please enter a valid email address'),
    mealsRequired: z
      .number()
      .int()
      .positive('Daily requirement must be greater than zero')
      .max(5000, 'Value exceeds single-kitchen intake capacity'),
    maxReceivingCapacity: z
      .number()
      .int()
      .positive('Maximum storage ceiling must be greater than zero')
      .max(10000, 'Storage ceiling too high'),
    acceptedCategories: z
      .array(z.enum(FOOD_CATEGORIES))
      .min(1, 'Please select at least one accepted food category'),
    acceptsNonVeg: z.boolean(),
    urgency: z.enum(URGENCY_LEVELS),
    operatingHours: z.string().min(3, 'Operating hours required (e.g. 08:00 - 22:00)'),
    beneficiaryDescription: z
      .string()
      .min(10, 'Please describe community beneficiaries (minimum 10 characters)')
      .max(512, 'Description too long'),
  })
  .refine((data) => data.maxReceivingCapacity >= data.mealsRequired, {
    message: 'Max receiving capacity must be equal to or greater than daily demand',
    path: ['maxReceivingCapacity'],
  });

export type NGORegistrationFormData = z.infer<typeof ngoRegistrationSchema>;

// 3. Volunteer Registration Schema
export const volunteerRegistrationSchema = z.object({
  name: z.string().min(2, 'Volunteer full name is required').max(128),
  contactPhone: z.string().min(6, 'Phone number required for dispatch').max(64),
  contactEmail: z.string().email('Valid email address required'),
  serviceArea: z.string().min(3, 'Primary service zone or route required').max(128),
  vehicleType: z.enum(['Two-Wheeler', 'Car / Van', 'Bicycle', 'Electric Cargo']),
});

export type VolunteerRegistrationFormData = z.infer<typeof volunteerRegistrationSchema>;

// 4. User Registration Schema
export const userRegistrationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(128),
  role: z.enum(['donor', 'ngo', 'volunteer', 'admin']),
  organizationName: z.string().max(128).optional(),
  phone: z.string().max(32).optional(),
});

export type UserRegistrationFormData = z.infer<typeof userRegistrationSchema>;

// 5. User Profile Schema
export const userProfileSchema = z.object({
  uid: z.string().min(1, 'User ID is required').max(128),
  email: z.string().email('Please enter a valid email address'),
  displayName: z.string().min(2, 'Display name is required').max(128),
  role: z.enum(['donor', 'ngo', 'volunteer', 'admin']),
  organizationName: z.string().max(128).optional(),
  phone: z.string().max(32).optional(),
  photoURL: z.string().url().optional().or(z.literal('')),
  isVerified: z.boolean().default(false),
  createdAt: z.string().optional(),
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>;

// 6. Volunteer Assignment Schema
export const volunteerAssignmentSchema = z.object({
  donationId: z.string().min(1, 'Donation ID is required'),
  volunteerId: z.string().min(1, 'Please select an available volunteer'),
  volunteerName: z.string().min(1, 'Volunteer name is required'),
  dispatchNotes: z.string().max(256).optional(),
  estimatedPickupMinutes: z
    .number({ message: 'Pickup ETA must be a number' })
    .int()
    .min(5, 'Minimum ETA is 5 minutes')
    .max(180, 'ETA cannot exceed 3 hours'),
  thermalHoldingConfirmed: z.boolean().refine((v) => v === true, {
    message: 'Courier must verify vehicle insulated holding box compliance',
  }),
});

export type VolunteerAssignmentFormData = z.infer<typeof volunteerAssignmentSchema>;


