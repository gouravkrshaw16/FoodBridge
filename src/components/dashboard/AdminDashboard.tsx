import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FoodDonation, NGO, Volunteer } from '../../types';
import { StatusBadge, VegBadge, UrgencyBadge } from '../common/Badge';
import { DonationDetailModal } from '../donations/DonationDetailModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Shield,
  Users,
  Building2,
  Bike,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Database,
  Search,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { checkAndMigrateDemoData } from '../../lib/dbService';

export const AdminDashboard: React.FC = () => {
  const {
    donations,
    ngos,
    volunteers,
    cancelDonation,
    toggleNGOVerification,
    toggleNGOAvailability,
    addToast,
    resetDemoData,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'donations' | 'ngos' | 'volunteers' | 'database'>('donations');
  const [inspectDonation, setInspectDonation] = useState<FoodDonation | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Safety check discrepancy / donor recall');
  const [isMigrating, setIsMigrating] = useState(false);

  const handleCancelDonation = () => {
    if (!cancelTargetId) return;
    cancelDonation(cancelTargetId, cancellationReason, 'Platform Administrator (buildingthefuture0007@gmail.com)');
    setCancelTargetId(null);
  };

  const handleMigrateSeedToFirestore = async () => {
    setIsMigrating(true);
    try {
      const res = await checkAndMigrateDemoData(true);
      if (res.migrated) {
        addToast(
          'success',
          'Cloud Firestore Synced',
          `Successfully migrated ${res.donationsCount} donations, ${res.ngosCount} NGOs, and ${res.volunteersCount} volunteers to live Firestore!`
        );
      } else {
        addToast('info', 'Firestore Active', 'Database already contains production data records.');
      }
    } catch (e) {
      addToast('error', 'Migration Failed', 'Could not sync seed data to Firestore.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Command Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-xs rounded-full text-xs font-semibold text-emerald-300 mb-3 border border-emerald-500/20">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>System Administrator Command</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Platform Governance & Compliance
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Inspect all registered entities, manage NGO safety approvals, resolve disputes or cancellations, and monitor live Cloud Firestore synchronization.
            </p>
          </div>

          <button
            onClick={handleMigrateSeedToFirestore}
            disabled={isMigrating}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            <span>{isMigrating ? 'Syncing to Firestore...' : 'Sync Demo Seed to Cloud Firestore'}</span>
          </button>
        </div>

        {/* Global Admin KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-xs text-slate-400">Total System Donations</p>
            <p className="text-2xl font-black">{donations.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Registered NGOs</p>
            <p className="text-2xl font-black">{ngos.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Active Field Couriers</p>
            <p className="text-2xl font-black">{volunteers.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Security Rule Status</p>
            <p className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-4 h-4" /> ABAC Fortress Deployed
            </p>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveSubTab('donations')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'donations'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Donations Audit ({donations.length})
        </button>
        <button
          onClick={() => setActiveSubTab('ngos')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'ngos'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          NGO Partner Governance ({ngos.length})
        </button>
        <button
          onClick={() => setActiveSubTab('volunteers')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'volunteers'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Volunteer Fleet ({volunteers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('database')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'database'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Database & Diagnostics
        </button>
      </div>

      {/* Tab: Donations Audit */}
      {activeSubTab === 'donations' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Donation</th>
                  <th className="py-3 px-4">Donor Org</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Claimed By</th>
                  <th className="py-3 px-4">Courier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{d.foodName}</div>
                      <div className="text-[11px] text-slate-400">{d.category}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{d.donorName}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{d.quantityMeals} meals</td>
                    <td className="py-3.5 px-4 text-slate-600">{d.claimedByNgoName || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{d.assignedVolunteerName || '—'}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setInspectDonation(d)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                      >
                        Details
                      </button>
                      {d.status !== 'Completed' && d.status !== 'Cancelled' && (
                        <button
                          onClick={() => setCancelTargetId(d.id)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg font-medium cursor-pointer"
                        >
                          Cancel / Recall
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: NGO Partner Governance */}
      {activeSubTab === 'ngos' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Toggle verification seals and intake availability for partner organizations</span>
          </div>
          <div className="divide-y divide-slate-100">
            {ngos.map((ngo) => (
              <div
                key={ngo.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{ngo.name}</h4>
                    {ngo.isVerified ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Verified Partner
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Pending Verification
                      </span>
                    )}
                    <UrgencyBadge urgency={ngo.urgency} />
                  </div>
                  <p className="text-xs text-slate-500">
                    Coordinator: <strong>{ngo.contactPerson}</strong> ({ngo.contactPhone}) • Location: {ngo.location}
                  </p>
                  <p className="text-xs text-slate-600">
                    Max Intake: <strong>{ngo.maxReceivingCapacity} meals</strong> • Daily Requirement:{' '}
                    <strong>{ngo.mealsRequired} meals</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleNGOAvailability(ngo.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border ${
                      ngo.isAvailable
                        ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {ngo.isAvailable ? 'Mark Unavailable' : 'Reactivate Intake'}
                  </button>

                  <button
                    onClick={() => toggleNGOVerification(ngo.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      ngo.isVerified
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    {ngo.isVerified ? 'Revoke Verification' : 'Approve & Verify'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Volunteer Fleet */}
      {activeSubTab === 'volunteers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {volunteers.map((vol) => (
              <div
                key={vol.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{vol.name}</h4>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                      {vol.vehicleType}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {vol.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Phone: {vol.contactPhone} • Service Route: {vol.serviceArea}
                  </p>
                  <p className="text-xs text-slate-600">
                    Completed Redeliveries: <strong>{vol.completedDeliveriesCount}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Database & Diagnostics */}
      {activeSubTab === 'database' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Database className="w-5 h-5 text-emerald-700" />
            <h3>Cloud Firestore & State Architecture</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The platform is integrated with Cloud Firestore using the database instance{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">
              ai-studio-foodbridgeai-48101034-8d66-4e1c-ae76-a972f02a3ac6
            </code>
            . Firestore security rules enforce attribute-based access control (ABAC), preventing privilege escalation and unauthenticated writes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-xs text-slate-800">Seed Data Sync</h4>
              <p className="text-xs text-slate-500">
                Populates realistic initial seed data into Firestore without overwriting custom donor entries.
              </p>
              <button
                onClick={handleMigrateSeedToFirestore}
                className="mt-2 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Sync Seed Data Now
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-xs text-slate-800">Reset Local Demo State</h4>
              <p className="text-xs text-slate-500">
                Resets the local browser cache and repopulates fresh baseline scenario records.
              </p>
              <button
                onClick={resetDemoData}
                className="mt-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Reset Local State
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Donation Modal */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-slate-900">Administrative Recall / Cancellation</h3>
            </div>
            <p className="text-xs text-slate-600">
              Enter official justification for cancelling this surplus donation lot. This will update the audit history and notify participants.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Cancellation Reason:</label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelTargetId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={handleCancelDonation}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {inspectDonation && (
        <DonationDetailModal
          donation={inspectDonation}
          isOpen={!!inspectDonation}
          onClose={() => setInspectDonation(null)}
        />
      )}
    </div>
  );
};
