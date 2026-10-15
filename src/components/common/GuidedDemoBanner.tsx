import React from 'react';
import { useApp } from '../../context/AppContext';
import { Play, ChevronRight, X, RotateCcw, CheckCircle2, Sparkles, User, Building2, Bike, Shield } from 'lucide-react';
import { RoleBadge } from './Badge';

export const GuidedDemoBanner: React.FC = () => {
  const { demoStep, isDemoActive, advanceDemoStep, exitGuidedDemo, resetDemoData, currentRole } = useApp();

  if (!isDemoActive) return null;

  const stepsInfo = [
    {
      title: 'Step 1: Surplus Listed by College Canteen',
      desc: '100 vegetarian meals listed by Apex Central Canteen with 2.5 hour collection deadline.',
      role: 'donor',
      action: 'Next: Run Matching Engine',
    },
    {
      title: 'Step 2: Deterministic AI Matching',
      desc: 'Evaluating candidate NGOs on proximity, urgency, batch size, diet, and remaining capacity.',
      role: 'ngo',
      action: 'Next: Inspect Explanations',
    },
    {
      title: 'Step 3: Review Transparent Explanations',
      desc: 'Asha Shelter scored #1 (~90%). Review non-blackbox scoring breakdown across 5 factors.',
      role: 'ngo',
      action: 'Next: Claim for Asha Shelter',
    },
    {
      title: 'Step 4: NGO Claims Food Lot',
      desc: 'Donation claimed with mandatory food hygiene acknowledgment. Storage capacity headroom decremented.',
      role: 'ngo',
      action: 'Next: Assign Courier',
    },
    {
      title: 'Step 5: Dispatch Delivery Volunteer',
      desc: 'Courier Rahul Sharma assigned with conflict-free validation to prevent overlapping runs.',
      role: 'volunteer',
      action: 'Next: Confirm Pickup',
    },
    {
      title: 'Step 6: Confirm Pickup at Kitchen Dock',
      desc: 'Courier collects insulated food cambros and begins transit to recipient shelter.',
      role: 'volunteer',
      action: 'Next: Shelter Kitchen Arrival',
    },
    {
      title: 'Step 7: Delivery Handover Inspection',
      desc: 'Food arrives at shelter. Recipient conducts thermal and sensory inspection check.',
      role: 'ngo',
      action: 'Next: Mark Completed',
    },
    {
      title: 'Step 8: Delivery Completed & Verified',
      desc: 'Donation marked Completed! Courier returned to available fleet. Beneficiary dinner served.',
      role: 'ngo',
      action: 'Next: Verify Analytics',
    },
    {
      title: 'Step 9: Real-Time Impact & Offsets',
      desc: 'Review live dashboard: meals redistributed, carbon emissions avoided, and complete audit trail.',
      role: 'admin',
      action: 'Finish Demonstration',
    },
  ];

  const currentStepData = stepsInfo[demoStep - 1] || stepsInfo[0];

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-[#0e3b24] to-emerald-950 text-white border-b border-emerald-800 px-4 py-3 shadow-md sticky top-[61px] z-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Progress and Step Explanation */}
        <div className="flex items-start md:items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-xs shrink-0 shadow-sm">
            {demoStep}/9
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-white text-sm tracking-tight">
                {currentStepData.title}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                Simulated {currentStepData.role.toUpperCase()} View
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 leading-tight">
              {currentStepData.desc}
            </p>
          </div>
        </div>

        {/* Right: Step Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button
            onClick={resetDemoData}
            title="Reset to initial state"
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/60 text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={advanceDemoStep}
            className="px-4 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>{currentStepData.action}</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={exitGuidedDemo}
            title="Exit Demo Mode"
            className="p-1.5 rounded-lg text-emerald-300 hover:text-rose-300 hover:bg-emerald-800/60 text-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
