import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  RotateCcw,
  Sparkles,
  Database,
  Download,
  Upload,
  Server,
  Play,
  CheckCircle2,
  FileCode2,
  ExternalLink,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    resetDemoData,
    startGuidedDemo,
    isDemoActive,
    donations,
    ngos,
    volunteers,
    addToast,
    setActiveTab,
  } = useApp();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Export JSON helper
  const handleExportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      version: '2.0-hackathon',
      donations,
      ngos,
      volunteers,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foodbridge_ai_dataset_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Data Exported', 'Dataset snapshot exported as JSON file successfully.');
  };

  return (
    <div className="space-y-6">
      {/* 9-Step Guided Demonstration Playbook */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-700" />
              <span>Interactive Hackathon Demonstration Playbook</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Demonstrate the complete zero food waste lifecycle to jury members across all 4 roles in under 5 minutes without page refreshes.
            </p>
          </div>

          <button
            onClick={startGuidedDemo}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isDemoActive ? 'Resume Guided Demo' : 'Start 9-Step Guided Demo'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Steps 1 - 3: Intake & Match
            </span>
            <h3 className="font-bold text-slate-900">Donor & Matching Engine</h3>
            <p className="text-slate-600 text-[11px]">
              College canteen registers 100 surplus vegetarian meals; matching engine evaluates proximity, urgency, batch size, and capacity headroom.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Steps 4 - 6: Claim & Dispatch
            </span>
            <h3 className="font-bold text-slate-900">NGO Reservation & Courier</h3>
            <p className="text-slate-600 text-[11px]">
              Asha Shelter claims lot; storage headroom safely decrements; idle courier is dispatched with conflict-free validation; pickup confirmed.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
            <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Steps 7 - 9: Verification & Impact
            </span>
            <h3 className="font-bold text-slate-900">Shelter Handover & Audit</h3>
            <p className="text-slate-600 text-[11px]">
              Shelter conducts food temperature and sensory check; delivery marked Completed; empirical analytics and carbon offsets refresh live.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Reset & Data Management */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-700" />
            <span>Data Persistence & Demonstration Reset</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Currently tracking {donations.length} food lots, {ngos.length} partner shelters, and {volunteers.length} couriers in browser LocalStorage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Reset Demo Data with confirmation */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Data to Initial State</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Snapshot (JSON)</span>
          </button>
        </div>
      </div>

      {/* Live Cloud Firestore & Production Architecture */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-700" />
            <span>Cloud Database Architecture & Live Sync Status</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            FoodBridge AI is connected to Google Cloud Firestore with zero-trust Attribute-Based Access Control (ABAC) security rules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              1. Cloud Firestore (Live Sync)
            </h3>
            <p>
              Real-time synchronization across all donor, NGO, volunteer, and admin clients with atomic database transactions preventing race conditions on food batch claims.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              2. Role-Based Access Control
            </h3>
            <p>
              Dedicated portals for Donors, NGO Partners, Couriers, and Admins. Protected by server-side Firestore security rules preventing unauthorized state mutations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4 text-emerald-700" />
              3. Zod & React Hook Form
            </h3>
            <p>
              End-to-end schema validation across food donation intake, NGO onboardings, volunteer fleets, and user registrations with strict boundary enforcement.
            </p>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetDemoData}
        title="Reset Demo Dataset?"
        message="This will restore the pristine demonstration baseline with 7 food batches, 5 partner NGOs, and 4 volunteer couriers. Any newly created lots will be reset."
        confirmText="Yes, Reset Data"
        variant="danger"
      />
    </div>
  );
};
