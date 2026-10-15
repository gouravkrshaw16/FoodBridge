import { FoodDonation, NGO, MatchResult, MatchScoreBreakdown } from '../types';

/**
 * Computes currently committed meals for an NGO based on all active donations
 * in 'Claimed' or 'Picked Up' states.
 */
export function getCommittedMealsForNGO(ngoId: string, donations: FoodDonation[]): number {
  return donations
    .filter(
      (d) =>
        d.claimedByNgoId === ngoId &&
        (d.status === 'Claimed' || d.status === 'Picked Up')
    )
    .reduce((sum, d) => sum + d.quantityMeals, 0);
}

/**
 * Computes remaining receiving capacity for an NGO.
 */
export function getRemainingCapacityForNGO(ngo: NGO, donations: FoodDonation[]): number {
  const committed = getCommittedMealsForNGO(ngo.id, donations);
  return Math.max(0, ngo.maxReceivingCapacity - committed);
}

/**
 * Deterministic Transparent Food Matching Algorithm
 * Strictly separates Eligibility from Scoring.
 * Max Score: 100 points
 * - Distance suitability: max 30 pts (simulated road proximity)
 * - NGO urgency level: max 25 pts (Critical: 25, High: 19, Medium: 12, Low: 5)
 * - Quantity compatibility: max 25 pts (optimal match with daily meals required)
 * - Food category & dietary fit: max 10 pts
 * - Remaining capacity headroom: max 10 pts
 */
export function calculateMatchScore(
  donation: FoodDonation,
  ngo: NGO,
  donationsRegistry: FoodDonation[] = []
): MatchScoreBreakdown {
  const explanations: string[] = [];
  const committedMeals = getCommittedMealsForNGO(ngo.id, donationsRegistry);
  const remainingCapacity = Math.max(0, ngo.maxReceivingCapacity - committedMeals);

  // 1. Mandatory Eligibility Checks (Strict exclusion rules)
  // Check A: Donation expiry
  const now = Date.now();
  const deadlineEpoch = new Date(donation.collectionDeadline).getTime();
  if (deadlineEpoch <= now || donation.status === 'Expired') {
    return {
      distanceScore: 0,
      urgencyScore: 0,
      quantityScore: 0,
      categoryScore: 0,
      capacityScore: 0,
      totalScore: 0,
      isCompatible: false,
      incompatibilityReason: 'Collection deadline has elapsed. Donation is no longer available.',
      explanations: ['Safety rule: Expired food lots cannot be dispatched under any circumstances.'],
      remainingCapacityAfter: remainingCapacity,
    };
  }

  // Check B: NGO availability status
  if (!ngo.isAvailable) {
    return {
      distanceScore: 0,
      urgencyScore: 0,
      quantityScore: 0,
      categoryScore: 0,
      capacityScore: 0,
      totalScore: 0,
      isCompatible: false,
      incompatibilityReason: `${ngo.name} is currently flagged as inactive or unavailable for intake.`,
      explanations: ['Organization has temporarily paused incoming food deliveries.'],
      remainingCapacityAfter: remainingCapacity,
    };
  }

  // Check C: Category compatibility
  const acceptsCategory = ngo.acceptedCategories.includes(donation.category);
  if (!acceptsCategory) {
    return {
      distanceScore: 0,
      urgencyScore: 0,
      quantityScore: 0,
      categoryScore: 0,
      capacityScore: 0,
      totalScore: 0,
      isCompatible: false,
      incompatibilityReason: `Does not accept ${donation.category} items (only accepts: ${ngo.acceptedCategories.join(', ')}).`,
      explanations: [`NGO kitchen is not equipped to process or store ${donation.category}.`],
      remainingCapacityAfter: remainingCapacity,
    };
  }

  // Check D: Vegetarian / Non-vegetarian compliance
  if (!donation.isVegetarian && !ngo.acceptsNonVeg) {
    return {
      distanceScore: 0,
      urgencyScore: 0,
      quantityScore: 0,
      categoryScore: 0,
      capacityScore: 0,
      totalScore: 0,
      isCompatible: false,
      incompatibilityReason: 'Food is Non-Vegetarian, but this NGO accepts strictly Pure Vegetarian food.',
      explanations: ['Dietary standard mismatch: Shelter policy strictly enforces pure vegetarian provisions.'],
      remainingCapacityAfter: remainingCapacity,
    };
  }

  // Check E: Remaining receiving capacity check (accounting for active pending claims!)
  if (donation.quantityMeals > remainingCapacity) {
    return {
      distanceScore: 0,
      urgencyScore: 0,
      quantityScore: 0,
      categoryScore: 0,
      capacityScore: 0,
      totalScore: 0,
      isCompatible: false,
      incompatibilityReason: `Donation size (${donation.quantityMeals} meals) exceeds remaining capacity (${remainingCapacity} meals remaining of ${ngo.maxReceivingCapacity} max; ${committedMeals} currently committed in active transit).`,
      explanations: [
        `Insufficient storage headroom: Shelter already has ${committedMeals} meals committed in active pickup runs.`,
      ],
      remainingCapacityAfter: remainingCapacity,
    };
  }

  // --- SCORING (Only for verified eligible candidates) ---

  // 1. Distance Score (Max 30 pts)
  let distanceScore = 0;
  const dist = ngo.simulatedDistanceKm;
  if (dist <= 2) {
    distanceScore = 30;
    explanations.push(`Proximity: Very close (${dist.toFixed(1)} km simulated road distance), ideal for swift thermal transport.`);
  } else if (dist <= 5) {
    distanceScore = Math.round(30 - (dist - 2) * 3); // 21 - 30
    explanations.push(`Proximity: Moderate transit range (${dist.toFixed(1)} km) within typical courier dispatch radius.`);
  } else if (dist <= 10) {
    distanceScore = Math.round(20 - (dist - 5) * 2); // 10 - 20
    explanations.push(`Proximity: Extended range (${dist.toFixed(1)} km), requires motorized vehicle dispatch.`);
  } else {
    distanceScore = Math.max(2, Math.round(10 - (dist - 10) * 0.5));
    explanations.push(`Proximity: Distant location (${dist.toFixed(1)} km), longer transit time required.`);
  }

  // 2. Urgency Score (Max 25 pts)
  let urgencyScore = 0;
  switch (ngo.urgency) {
    case 'Critical':
      urgencyScore = 25;
      explanations.push('Urgency: Critical need — high beneficiary demand requiring immediate dinner/lunch supplies today.');
      break;
    case 'High':
      urgencyScore = 19;
      explanations.push('Urgency: High demand — active daily feeding schedule awaiting incoming donations.');
      break;
    case 'Medium':
      urgencyScore = 12;
      explanations.push('Urgency: Medium demand — food can be incorporated into scheduled meal service.');
      break;
    case 'Low':
      urgencyScore = 5;
      explanations.push('Urgency: Low demand — stable current reserves; accepts supplementary batches.');
      break;
  }

  // 3. Quantity Compatibility (Max 25 pts)
  const ratio = donation.quantityMeals / (ngo.mealsRequired || 1);
  let quantityScore = 0;
  if (ratio >= 0.8 && ratio <= 1.25) {
    quantityScore = 25;
    explanations.push(`Batch Size: Excellent fit (${donation.quantityMeals} meals meets ~${Math.round(ratio * 100)}% of daily demand).`);
  } else if (ratio > 1.25 && ratio <= 1.8) {
    quantityScore = 20;
    explanations.push(`Batch Size: Substantial surplus (${donation.quantityMeals} meals for ${ngo.mealsRequired} target), fits within storage ceiling.`);
  } else if (ratio >= 0.5 && ratio < 0.8) {
    quantityScore = 18;
    explanations.push(`Batch Size: Partial fulfillment (${donation.quantityMeals} of ${ngo.mealsRequired} meals, ${Math.round(ratio * 100)}% coverage).`);
  } else if (ratio < 0.5) {
    quantityScore = 12;
    explanations.push(`Batch Size: Small supplement (${donation.quantityMeals} meals towards ${ngo.mealsRequired} needed).`);
  } else {
    quantityScore = 14;
    explanations.push(`Batch Size: Large lot (${donation.quantityMeals} meals) utilizes significant intake capacity.`);
  }

  // 4. Food Category & Dietary Match (Max 10 pts)
  let categoryScore = 10;
  if (donation.isVegetarian) {
    explanations.push(`Dietary: Pure vegetarian meal aligns universally with shelter resident requirements.`);
  } else {
    categoryScore = 8;
    explanations.push(`Dietary: Non-vegetarian batch verified compatible with shelter cold storage policy.`);
  }

  // 5. Receiving Capacity Headroom (Max 10 pts)
  const remainingAfter = remainingCapacity - donation.quantityMeals;
  let capacityScore = 10;
  if (remainingAfter < 15) {
    capacityScore = 5;
    explanations.push(`Headroom: Tight storage buffer (${remainingAfter} meals buffer remaining after this delivery).`);
  } else {
    capacityScore = 10;
    explanations.push(`Headroom: Ample storage margin (${remainingAfter} meals capacity buffer remaining).`);
  }

  const totalScore = Math.min(100, distanceScore + urgencyScore + quantityScore + categoryScore + capacityScore);

  return {
    distanceScore,
    urgencyScore,
    quantityScore,
    categoryScore,
    capacityScore,
    totalScore,
    isCompatible: true,
    explanations,
    remainingCapacityAfter: remainingAfter,
  };
}

/**
 * Matches a donation with all NGOs and sorts by compatibility and score.
 */
export function matchDonationWithNGOs(
  donation: FoodDonation,
  ngos: NGO[],
  donationsRegistry: FoodDonation[] = []
): MatchResult[] {
  return ngos
    .map((ngo) => {
      const committedMeals = getCommittedMealsForNGO(ngo.id, donationsRegistry);
      const remainingCapacity = Math.max(0, ngo.maxReceivingCapacity - committedMeals);
      const scoreBreakdown = calculateMatchScore(donation, ngo, donationsRegistry);
      return {
        ngo,
        scoreBreakdown,
        remainingCapacity,
        committedMeals,
      };
    })
    .filter((result) => result.scoreBreakdown.isCompatible)
    .sort((a, b) => b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore);
}

/**
 * Returns all candidate NGOs including reasons why ineligible ones were excluded.
 */
export function evaluateAllNGOCandidates(
  donation: FoodDonation,
  ngos: NGO[],
  donationsRegistry: FoodDonation[] = []
): Array<{
  ngo: NGO;
  isEligible: boolean;
  scoreBreakdown: MatchScoreBreakdown;
  remainingCapacity: number;
  committedMeals: number;
}> {
  return ngos.map((ngo) => {
    const committedMeals = getCommittedMealsForNGO(ngo.id, donationsRegistry);
    const remainingCapacity = Math.max(0, ngo.maxReceivingCapacity - committedMeals);
    const scoreBreakdown = calculateMatchScore(donation, ngo, donationsRegistry);
    return {
      ngo,
      isEligible: scoreBreakdown.isCompatible,
      scoreBreakdown,
      remainingCapacity,
      committedMeals,
    };
  });
}
