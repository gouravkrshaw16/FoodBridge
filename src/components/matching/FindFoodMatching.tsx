import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FoodDonation, NGO, MatchResult } from '../../types';
import { matchDonationWithNGOs, evaluateAllNGOCandidates } from '../../utils/matchingEngine';
import { StatusBadge, VegBadge, UrgencyBadge, FoodSafetyLevelBadge } from '../common/Badge';
import { ClaimDonationModal } from './ClaimDonationModal';
import {
  Sparkles,
  ArrowRight,
  MapPin,
  Clock,
  Building,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Award,
  Layers,
  XCircle,
  Info,
} from 'lucide-react';

export const FindFoodMatching: React.FC = () => {
  const {
    donations,
    ngos,
    selectedDonationForMatch,
    setSelectedDonationForMatch,
    claimDonation,
    setActiveTab,
    currentRole,
  } = useApp();

  const availableDonations = useMemo(() => {
    return donations.filter((d) => d.status === 'Available');
  }, [donations]);

  const activeDonation = useMemo(() => {
    if (selectedDonationForMatch) {
      return donations.find((d) => d.id === selectedDonationForMatch.id) || availableDonations[0] || donations[0];
    }
    return availableDonations[0] || donations[0];
  }, [selectedDonationForMatch, donations, availableDonations]);

  const [sortBy, setSortBy] = useState<'score' | 'distance'>('score');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('All');
  const [showIneligible, setShowIneligible] = useState(false);
  const [selectedNgoForClaim, setSelectedNgoForClaim] = useState<{
    ngo: NGO;
    score: number;
    remainingCapacity: number;
    committedMeals: number;
  } | null>(null);

  // Compute all candidates evaluation
  const allCandidateEvaluations = useMemo(() => {
    if (!activeDonation) return [];
    return evaluateAllNGOCandidates(activeDonation, ngos, donations);
  }, [activeDonation, ngos, donations]);

  // Filtered & sorted eligible matches
  const matchResults = useMemo(() => {
    if (!activeDonation) return [];
    let results = matchDonationWithNGOs(activeDonation, ngos, donations);

    if (urgencyFilter !== 'All') {
      results = results.filter((r) => r.ngo.urgency === urgencyFilter);
    }

    if (sortBy === 'distance') {
      results.sort((a, b) => a.ngo.simulatedDistanceKm - b.ngo.simulatedDistanceKm);
    } else {
      results.sort((a, b) => b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore);
    }

    return results;
  }, [activeDonation, ngos, donations, sortBy, urgencyFilter]);

  const ineligibleCandidates = useMemo(() => {
    return allCandidateEvaluations.filter((c) => !c.isEligible);
  }, [allCandidateEvaluations]);

  const handleClaimSuccess = async (donationId: string, ngoId: string, ngoName: string) => {
    const actor = currentRole === 'ngo' ? `${ngoName} Coordinator` : 'Platform Dispatch';
    const success = await claimDonation(donationId, ngoId, ngoName, actor);
    if (success) {
      setSelectedNgoForClaim(null);
      setActiveTab('volunteers');
    }
  };

  return (
    <div className="space-y-6">
      {/* Algorithm Transparency Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-[#0e3b24] text-white p-5 rounded-2xl shadow-sm border border-emerald-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-4 h-4 text-emerald-300" />
              </span>
              <h2 className="text-lg font-bold">Deterministic 5-Factor Matching Engine</h2>
            </div>
            <p className="text-xs text-emerald-200/90 max-w-2xl leading-relaxed">
              Transparent, non-blackbox algorithmic evaluation pairing surplus meals with verified shelters.
              Scores candidate kitchens on proximity (30 pts), urgency level (25 pts), batch quantity match (25 pts), dietary compatibility (10 pts), and intake headroom (10 pts).
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-emerald-950/60 px-3.5 py-2 rounded-xl border border-emerald-800 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300 font-mono">100% Deterministic • Non-Blackbox</span>
          </div>
        </div>
      </div>

      {/* Donation Lot Selector */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Active Surplus Lot to Redistribute:
            </label>
            <p className="text-xs text-slate-500">
              Select an available surplus lot to calculate compatibility with registered NGO kitchens
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={activeDonation?.id || ''}
              onChange={(e) => {
                const found = donations.find((d) => d.id === e.target.value);
                if (found) setSelectedDonationForMatch(found);
              }}
              className="w-full sm:w-80 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {donations.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.status}] {d.foodName} ({d.quantityMeals} meals)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Donation Highlight Card */}
        {activeDonation && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={activeDonation.status} size="sm" />
                <FoodSafetyLevelBadge
                  collectionDeadline={activeDonation.collectionDeadline}
                  status={activeDonation.status}
                />
                <VegBadge isVegetarian={activeDonation.isVegetarian} />
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-semibold">
                  {activeDonation.category}
                </span>
                <span className="text-xs text-slate-500 font-medium truncate">
                  By {activeDonation.donorName} ({activeDonation.donorType})
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{activeDonation.foodName}</h3>
              <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {activeDonation.pickupLocation}
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-800">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Deadline: {new Date(activeDonation.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0 bg-white px-4 py-2.5 rounded-xl border border-slate-200">
              <span className="text-2xl font-black text-emerald-800 block leading-none">
                {activeDonation.quantityMeals}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Servings</span>
            </div>
          </div>
        )}
      </div>

      {/* Sorting & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Sort & Filter:</span>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'score' | 'distance')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="score">Sort by Highest Match Score</option>
            <option value="distance">Sort by Closest Proximity (km)</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Urgency Levels</option>
            <option value="Critical">Critical Urgency Only</option>
            <option value="High">High Urgency Only</option>
            <option value="Medium">Medium Urgency Only</option>
          </select>

          <button
            onClick={() => setShowIneligible(!showIneligible)}
            className={`px-2.5 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
              showIneligible
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {showIneligible ? 'Hide Ineligible NGOs' : `Show Ineligible NGOs (${ineligibleCandidates.length})`}
          </button>
        </div>

        <p className="text-slate-500 font-medium">
          Found <span className="font-bold text-slate-800">{matchResults.length}</span> eligible verified NGO kitchens
        </p>
      </div>

      {/* Ineligible Organizations Drawer / List if toggled */}
      {showIneligible && ineligibleCandidates.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
          <div className="flex items-center gap-2 text-rose-950 font-bold text-xs">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Excluded / Ineligible Candidates ({ineligibleCandidates.length})</span>
            <span className="text-[11px] font-normal text-rose-700">
              (Strict exclusion rules protect shelter safety and intake limits)
            </span>
          </div>

          <div className="space-y-2">
            {ineligibleCandidates.map(({ ngo, scoreBreakdown, remainingCapacity, committedMeals }) => (
              <div
                key={ngo.id}
                className="p-3 rounded-xl bg-white border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{ngo.name}</span>
                  <p className="text-rose-700 text-[11px] mt-0.5 font-medium">
                    Reason: {scoreBreakdown.incompatibilityReason}
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-500 shrink-0">
                  <span>Capacity: {remainingCapacity} free / {ngo.maxReceivingCapacity} max</span>
                  <span className="block text-[10px] text-amber-700">({committedMeals} meals committed in transit)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Cards List */}
      {matchResults.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No Eligible NGOs Found for this Batch</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            Registered organizations either do not accept this category ({activeDonation?.category}), exceed current capacity limits, or are temporarily offline.
          </p>
          <button
            onClick={() => {
              setUrgencyFilter('All');
              setSortBy('score');
              setShowIneligible(true);
            }}
            className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 cursor-pointer"
          >
            Review Exclusion Reasons
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {matchResults.map((result, idx) => {
            const { ngo, scoreBreakdown, remainingCapacity, committedMeals } = result;
            const isTopMatch = idx === 0 && scoreBreakdown.totalScore >= 80;

            return (
              <div
                key={ngo.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs ${
                  isTopMatch
                    ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: NGO info & match breakdown */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isTopMatch && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs">
                          <Award className="w-3 h-3 text-amber-300" />
                          Top Recommended Match
                        </span>
                      )}
                      <UrgencyBadge urgency={ngo.urgency} />
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {ngo.simulatedDistanceKm.toFixed(1)} km simulated road distance
                      </span>
                      {ngo.isVerified && (
                        <span className="text-[10px] text-emerald-800 bg-emerald-50 font-bold px-2 py-0.5 rounded border border-emerald-200">
                          Verified Shelter
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                        {ngo.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{ngo.location}</span>
                        <span>• Contact: {ngo.contactPerson} ({ngo.contactPhone})</span>
                        <span>• Hours: {ngo.operatingHours}</span>
                      </p>
                      <p className="text-xs text-slate-600 mt-1 italic">
                        "{ngo.beneficiaryDescription}"
                      </p>
                    </div>

                    {/* Capacity and Headroom strip */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-700" />
                        Intake Storage Capacity:
                      </span>
                      <span className="text-slate-600">
                        <strong className="text-emerald-800">{remainingCapacity} meals free</strong> ({committedMeals} in transit / {ngo.maxReceivingCapacity} max)
                      </span>
                    </div>

                    {/* Transparent Explanations Box */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Why Recommended (Non-Blackbox Explanations):</span>
                      </div>
                      <ul className="space-y-1 pl-4 list-disc text-slate-600 text-[11px] leading-relaxed">
                        {scoreBreakdown.explanations.map((exp, i) => (
                          <li key={i}>{exp}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Factor Points Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center">
                      <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                        <span className="text-[10px] text-slate-500 block">Proximity</span>
                        <span className="text-xs font-black text-emerald-900">{scoreBreakdown.distanceScore}/30</span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                        <span className="text-[10px] text-slate-500 block">Urgency</span>
                        <span className="text-xs font-black text-emerald-900">{scoreBreakdown.urgencyScore}/25</span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                        <span className="text-[10px] text-slate-500 block">Batch Fit</span>
                        <span className="text-xs font-black text-emerald-900">{scoreBreakdown.quantityScore}/25</span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                        <span className="text-[10px] text-slate-500 block">Diet / Cat</span>
                        <span className="text-xs font-black text-emerald-900">{scoreBreakdown.categoryScore}/10</span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                        <span className="text-[10px] text-slate-500 block">Capacity Buffer</span>
                        <span className="text-xs font-black text-emerald-900">{scoreBreakdown.capacityScore}/10</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score card & CTA */}
                  <div className="lg:w-48 shrink-0 flex flex-col justify-between items-center sm:items-end border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-5 space-y-4">
                    <div className="text-center sm:text-right">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-900 font-black text-2xl shadow-xs">
                        {scoreBreakdown.totalScore}
                      </div>
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                        Compatibility Score
                      </span>
                    </div>

                    <div className="w-full">
                      {activeDonation.status === 'Available' ? (
                        <button
                          onClick={() =>
                            setSelectedNgoForClaim({
                              ngo,
                              score: scoreBreakdown.totalScore,
                              remainingCapacity,
                              committedMeals,
                            })
                          }
                          className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Claim for NGO</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="w-full py-2 px-3 bg-slate-100 text-slate-500 rounded-xl text-xs text-center font-medium">
                          Lot is {activeDonation.status}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Claim Allocation Modal */}
      <ClaimDonationModal
        isOpen={!!selectedNgoForClaim}
        onClose={() => setSelectedNgoForClaim(null)}
        donation={activeDonation}
        ngo={selectedNgoForClaim?.ngo || null}
        matchScore={selectedNgoForClaim?.score || 0}
        remainingCapacity={selectedNgoForClaim?.remainingCapacity || 0}
        committedMeals={selectedNgoForClaim?.committedMeals || 0}
        onConfirmClaim={handleClaimSuccess}
      />
    </div>
  );
};
