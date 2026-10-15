import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { DonationFormModal } from './components/donations/DonationFormModal';
import { GuidedDemoBanner } from './components/common/GuidedDemoBanner';

// Views
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { FoodDonationManagement } from './components/donations/FoodDonationManagement';
import { FindFoodMatching } from './components/matching/FindFoodMatching';
import { NGOPartners } from './components/ngos/NGOPartners';
import { VolunteerCoordination } from './components/volunteers/VolunteerCoordination';
import { ImpactAnalytics } from './components/analytics/ImpactAnalytics';
import { FoodBridgeAssistant } from './components/assistant/FoodBridgeAssistant';
import { SettingsView } from './components/settings/SettingsView';

const MainLayout: React.FC = () => {
  const { activeTab, addDonation } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard />;
      case 'donations':
        return <FoodDonationManagement />;
      case 'find-food':
        return <FindFoodMatching />;
      case 'ngos':
        return <NGOPartners />;
      case 'volunteers':
        return <VolunteerCoordination />;
      case 'analytics':
        return <ImpactAnalytics />;
      case 'assistant':
        return <FoodBridgeAssistant />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f9f6] text-slate-800 flex flex-col md:flex-row antialiased">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0">
        {/* Sticky Top Header */}
        <Header
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenAddDonation={() => setIsQuickAddModalOpen(true)}
        />

        {/* Guided Demo Stepper Banner (Visible when Demo Mode is Active) */}
        <GuidedDemoBanner />

        {/* Page Content Body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {renderActiveTabContent()}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-200/80 bg-white/60 py-4 px-6 text-center text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <p>
              <strong className="text-slate-800 font-semibold">FoodBridge AI</strong> — Zero Food Waste Redistribution Network
            </p>
            <p className="text-[11px] text-slate-400">
              Collegiate Hackathon Demonstration Prototype • Deterministic Matching Engine
            </p>
          </div>
        </footer>
      </div>

      {/* Global Quick Add Donation Modal */}
      <DonationFormModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onSubmit={addDonation}
      />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
