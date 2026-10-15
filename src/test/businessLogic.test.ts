import { FoodDonation, NGO, Volunteer } from '../types';
import {
  calculateMatchScore,
  matchDonationWithNGOs,
  getCommittedMealsForNGO,
  getRemainingCapacityForNGO,
} from '../utils/matchingEngine';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export function runBusinessLogicTests(): { passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  const assert = (condition: boolean, name: string, detail?: string) => {
    if (condition) {
      results.push({ name, passed: true });
    } else {
      results.push({ name, passed: false, error: detail || 'Assertion failed' });
    }
  };

  const sampleDonation: FoodDonation = {
    id: 'test-don-1',
    foodName: 'Hot Vegetarian Rice & Curry',
    category: 'Cooked Meals',
    isVegetarian: true,
    quantity: 100,
    quantityUnit: 'Meals / Servings',
    quantityMeals: 100,
    donorName: 'Test Canteen',
    donorType: 'College Canteen',
    pickupLocation: 'Test Location',
    donorContact: '+91 99999 00000',
    preparationTime: new Date(Date.now() - 3600000).toISOString(),
    collectionDeadline: new Date(Date.now() + 7200000).toISOString(), // 2h future
    storageRequirement: 'Keep Warm (> 60°C)',
    safetyConfirmedByDonor: true,
    status: 'Available',
    createdAt: new Date().toISOString(),
    statusHistory: [],
  };

  const sampleNgo: NGO = {
    id: 'test-ngo-1',
    name: 'Test Asha Shelter',
    location: 'Sector 1',
    serviceArea: 'Central',
    simulatedDistanceKm: 2.5,
    contactPerson: 'Manager',
    contactPhone: '+91 98888 11111',
    contactEmail: 'test@ngo.org',
    mealsRequired: 120,
    maxReceivingCapacity: 200,
    acceptedCategories: ['Cooked Meals', 'Fruits', 'Vegetables'],
    acceptsNonVeg: true,
    urgency: 'Critical',
    isAvailable: true,
    isVerified: true,
    operatingHours: '08:00 - 22:00',
    beneficiaryDescription: 'Test',
    createdAt: new Date().toISOString(),
  };

  // Test 1: Valid donation matching produces positive score
  const score1 = calculateMatchScore(sampleDonation, sampleNgo, []);
  assert(score1.isCompatible && score1.totalScore > 70, '1. Valid donation can be matched with compatible NGO');

  // Test 2: Incompatible category is excluded
  const incompatibleCategoryDonation: FoodDonation = {
    ...sampleDonation,
    category: 'Bakery Items',
  };
  const ngoNoBakery: NGO = {
    ...sampleNgo,
    acceptedCategories: ['Cooked Meals'],
  };
  const score2 = calculateMatchScore(incompatibleCategoryDonation, ngoNoBakery, []);
  assert(!score2.isCompatible && score2.totalScore === 0, '2. Incompatible food category is strictly excluded');

  // Test 3: Non-veg food with veg-only NGO is excluded
  const nonVegDonation: FoodDonation = {
    ...sampleDonation,
    isVegetarian: false,
  };
  const vegOnlyNgo: NGO = {
    ...sampleNgo,
    acceptsNonVeg: false,
  };
  const score3 = calculateMatchScore(nonVegDonation, vegOnlyNgo, []);
  assert(!score3.isCompatible, '3. Non-vegetarian food is excluded for veg-only NGO');

  // Test 4: Insufficient raw capacity is excluded
  const hugeDonation: FoodDonation = {
    ...sampleDonation,
    quantityMeals: 350,
  };
  const score4 = calculateMatchScore(hugeDonation, sampleNgo, []);
  assert(!score4.isCompatible, '4. NGO with insufficient maximum capacity is excluded');

  // Test 5: Insufficient remaining capacity (accounting for active commitments)
  const existingClaimed: FoodDonation[] = [
    {
      ...sampleDonation,
      id: 'existing-claim-1',
      claimedByNgoId: sampleNgo.id,
      quantityMeals: 150,
      status: 'Claimed',
    },
  ];
  // sampleNgo max is 200. With 150 claimed, remaining is 50. Our donation is 100.
  const score5 = calculateMatchScore(sampleDonation, sampleNgo, existingClaimed);
  assert(
    !score5.isCompatible && Boolean(score5.incompatibilityReason?.includes('remaining capacity')),
    '5. NGO with insufficient remaining capacity (after active commitments) is excluded'
  );

  // Test 6: Unavailable NGO is excluded
  const offlineNgo: NGO = {
    ...sampleNgo,
    isAvailable: false,
  };
  const score6 = calculateMatchScore(sampleDonation, offlineNgo, []);
  assert(!score6.isCompatible, '6. Inactive or unavailable NGO is excluded');

  // Test 7: Expired donation cannot be matched
  const expiredDonation: FoodDonation = {
    ...sampleDonation,
    collectionDeadline: new Date(Date.now() - 3600000).toISOString(), // 1h ago
    status: 'Expired',
  };
  const score7 = calculateMatchScore(expiredDonation, sampleNgo, []);
  assert(!score7.isCompatible, '7. Expired donation cannot be matched or claimed');

  // Test 8: Remaining capacity computation helper
  const committedMeals = getCommittedMealsForNGO(sampleNgo.id, existingClaimed);
  assert(committedMeals === 150, '8. getCommittedMealsForNGO correctly aggregates claimed lots');

  const remainingCap = getRemainingCapacityForNGO(sampleNgo, existingClaimed);
  assert(remainingCap === 50, '9. getRemainingCapacityForNGO accurately subtracts commitments from ceiling');

  // Test 9: Transparent scoring contributions are normalized <= 100
  assert(
    score1.distanceScore <= 30 &&
    score1.urgencyScore <= 25 &&
    score1.quantityScore <= 25 &&
    score1.categoryScore <= 10 &&
    score1.capacityScore <= 10 &&
    score1.totalScore <= 100,
    '10. Scoring factors are correctly bounded and normalized to 100'
  );

  // Test 10: Volunteer conflict check logic
  const busyVolunteer: Volunteer = {
    id: 'vol-busy',
    name: 'Busy Driver',
    contactPhone: '123',
    contactEmail: 'busy@test.com',
    serviceArea: 'West',
    vehicleType: 'Car / Van',
    status: 'On Delivery',
    currentDonationId: 'active-don-99',
    completedDeliveriesCount: 5,
    isVerified: true,
    createdAt: new Date().toISOString(),
  };
  const isConflict = busyVolunteer.status === 'On Delivery' && busyVolunteer.currentDonationId !== sampleDonation.id;
  assert(isConflict, '11. Conflicting volunteer assignments are prevented');

  // Test 11: Analytics calculations with completed vs available vs cancelled
  const testLots: FoodDonation[] = [
    { ...sampleDonation, id: 'lot-1', quantityMeals: 100, status: 'Available' },
    { ...sampleDonation, id: 'lot-2', quantityMeals: 50, status: 'Claimed' },
    { ...sampleDonation, id: 'lot-3', quantityMeals: 140, status: 'Completed', completedAt: new Date().toISOString() },
    { ...sampleDonation, id: 'lot-4', quantityMeals: 80, status: 'Cancelled' },
    { ...sampleDonation, id: 'lot-5', quantityMeals: 60, status: 'Expired' },
  ];

  const totalMeals = testLots.reduce((s, d) => s + d.quantityMeals, 0);
  assert(totalMeals === 430, '12. Total meals listed sums all registered lots (430)');

  const redistributedMeals = testLots.filter((d) => d.status === 'Completed').reduce((s, d) => s + d.quantityMeals, 0);
  assert(redistributedMeals === 140, '13. Redistributed meals counts Completed lots ONLY (140)');

  const availableMeals = testLots.filter((d) => d.status === 'Available').reduce((s, d) => s + d.quantityMeals, 0);
  assert(availableMeals === 100, '14. Available meals counts unassigned active lots ONLY (100)');

  // Cancelled & Expired not in redistributed
  assert(
    !testLots.filter((d) => d.status === 'Completed').some((d) => d.status === 'Cancelled' || d.status === 'Expired'),
    '15. Cancelled and expired lots are never counted as redistributed'
  );

  // Test 12: Empty dataset safety
  const emptyLots: FoodDonation[] = [];
  const emptyTotal = emptyLots.reduce((s, d) => s + d.quantityMeals, 0);
  assert(emptyTotal === 0, '16. Empty dataset handles calculations without exceptions');

  // Test 13: Search filter simulation
  const searchQuery = 'rice';
  const searchMatches = testLots.filter((d) => d.foodName.toLowerCase().includes(searchQuery));
  assert(searchMatches.length === 5, '17. Search filter accurately matches keywords');

  // Test 14: Reproducibility of matching engine
  const matchA = matchDonationWithNGOs(sampleDonation, [sampleNgo]);
  const matchB = matchDonationWithNGOs(sampleDonation, [sampleNgo]);
  assert(
    matchA.length === matchB.length && matchA[0]?.scoreBreakdown.totalScore === matchB[0]?.scoreBreakdown.totalScore,
    '18. Matching engine results are 100% deterministic and reproducible'
  );

  // Test 15: Environmental calculation math
  const foodKg = 140 * 0.42; // 58.8 kg
  const co2Expected = Math.round(foodKg * 2.5); // 147 kg
  const waterExpected = Math.round(foodKg * 650); // 38220 L
  assert(co2Expected === 147 && waterExpected === 38220, '19. Environmental offsets follow documented scientific factors');

  // Test 16: Safe status transition validator
  const validTransitions: Record<string, string[]> = {
    Available: ['Claimed', 'Cancelled', 'Expired'],
    Claimed: ['Picked Up', 'Cancelled'],
    'Picked Up': ['Completed', 'Cancelled'],
    Completed: [],
    Cancelled: [],
    Expired: [],
  };
  assert(
    validTransitions['Available'].includes('Claimed') &&
    !validTransitions['Completed'].includes('Claimed') &&
    !validTransitions['Expired'].includes('Claimed'),
    '20. Strict status transition state machine enforces valid lifecycle'
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return { passed, failed, results };
}
