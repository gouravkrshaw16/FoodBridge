import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Send,
  Bot,
  User,
  AlertTriangle,
  Clock,
  Building2,
  Bike,
  HeartHandshake,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionButton?: {
    label: string;
    tab: 'donations' | 'find-food' | 'volunteers' | 'analytics' | 'ngos' | 'overview';
    extraAction?: () => void;
  };
}

const PRESET_QUERIES = [
  'Which food donations are approaching collection cutoff?',
  'Which donations currently need a volunteer courier dispatched?',
  'What is the top recommended NGO match for active donations?',
  'How many meals have been successfully redistributed?',
  'What operational bottlenecks require immediate action?',
];

export const FoodBridgeAssistant: React.FC = () => {
  const {
    donations,
    ngos,
    volunteers,
    stats,
    urgentDonations,
    expiredDonations,
    setActiveTab,
    setSelectedDonationForMatch,
  } = useApp();

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: "Hello! I am your FoodBridge AI Operational Assistant. I analyze real-time platform data to help donors, NGOs, and dispatchers coordinate surplus food without waste. Ask me anything or select a prompt below.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleQuery = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // Rule-based deterministic operational analysis
    setTimeout(() => {
      const lower = queryText.toLowerCase();
      let responseText = '';
      let actionBtn: Message['actionButton'] = undefined;

      if (lower.includes('approaching') || lower.includes('cutoff') || lower.includes('urgent') || lower.includes('deadline')) {
        if (urgentDonations.length === 0) {
          responseText = "Great news! Currently, there are no food lots within the 4-hour critical collection window. All active batches have adequate pickup buffers.";
        } else {
          const list = urgentDonations
            .map(
              (d) =>
                `• "${d.foodName}" (${d.quantityMeals} meals) from ${d.donorName} — Cutoff at ${new Date(d.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            )
            .join('\n');
          responseText = `Found ${urgentDonations.length} urgent food donation(s) approaching collection cutoff:\n\n${list}\n\nImmediate courier assignment is recommended to prevent thermal degradation.`;
          actionBtn = {
            label: 'View Urgent Donations',
            tab: 'donations',
          };
        }
      } else if (lower.includes('volunteer') || lower.includes('courier') || lower.includes('dispatch') || lower.includes('need a volunteer')) {
        const needsCourier = donations.filter((d) => d.status === 'Claimed' && !d.assignedVolunteerId);
        const availableCouriers = volunteers.filter((v) => v.status === 'Available');

        if (needsCourier.length === 0) {
          responseText = `All claimed donations currently have assigned couriers. There are ${availableCouriers.length} idle couriers in the fleet ready for new assignments.`;
        } else {
          const items = needsCourier
            .map((d) => `• Lot #${d.id}: "${d.foodName}" (${d.quantityMeals} meals) reserved by ${d.claimedByNgoName}`)
            .join('\n');
          responseText = `Attention: ${needsCourier.length} claimed donation(s) are waiting for volunteer couriers to be assigned:\n\n${items}\n\nYou currently have ${availableCouriers.length} available courier(s) ready for dispatch.`;
          actionBtn = {
            label: 'Open Volunteer Dispatch',
            tab: 'volunteers',
          };
        }
      } else if (lower.includes('match') || lower.includes('top recommended') || lower.includes('recommend')) {
        const availableBatch = donations.find((d) => d.status === 'Available');
        if (!availableBatch) {
          responseText = "There are currently no unassigned Available donations to match. All lots are either claimed, completed, or expired.";
        } else {
          responseText = `For the available lot "${availableBatch.foodName}" (${availableBatch.quantityMeals} meals from ${availableBatch.donorName}), the matching engine prioritizes nearby verified shelters with sufficient intake capacity.\n\nRecommended: Run the 5-Factor Matching Engine to inspect compatibility scores, distance, and storage buffer calculations.`;
          actionBtn = {
            label: `Match "${availableBatch.foodName.slice(0, 24)}..."`,
            tab: 'find-food',
            extraAction: () => setSelectedDonationForMatch(availableBatch),
          };
        }
      } else if (lower.includes('redistributed') || lower.includes('impact') || lower.includes('carbon') || lower.includes('meals have been')) {
        responseText = `To date, FoodBridge AI has verified the redistribution of ${stats.mealsRedistributed} meals across ${stats.completedDonationsCount} completed deliveries.\n\nEnvironmental impact achieved:\n• ${stats.co2KgSaved} kg CO₂ equivalent greenhouse gas emissions prevented\n• ${stats.waterLitersSaved.toLocaleString()} liters embedded agricultural water conserved.`;
        actionBtn = {
          label: 'View Detailed Impact Analytics',
          tab: 'analytics',
        };
      } else if (lower.includes('bottleneck') || lower.includes('operational problem') || lower.includes('problem')) {
        const issues: string[] = [];
        const needsCourier = donations.filter((d) => d.status === 'Claimed' && !d.assignedVolunteerId);
        if (urgentDonations.length > 0) {
          issues.push(`⚠️ ${urgentDonations.length} donation(s) near collection deadline without completed pickup.`);
        }
        if (needsCourier.length > 0) {
          issues.push(`⚠️ ${needsCourier.length} claimed lot(s) lack assigned volunteer drivers.`);
        }
        if (expiredDonations.length > 0) {
          issues.push(`ℹ️ ${expiredDonations.length} lot(s) expired due to lapsed collection windows.`);
        }
        const offlineNgos = ngos.filter((n) => !n.isAvailable).length;
        if (offlineNgos > 0) {
          issues.push(`ℹ️ ${offlineNgos} partner shelter(s) are currently marked intake-paused.`);
        }

        if (issues.length === 0) {
          responseText = "Operational pipeline is running cleanly! No urgent bottlenecks detected.";
        } else {
          responseText = `Identified ${issues.length} operational items for review:\n\n${issues.join('\n')}\n\nPriority: Clear unassigned couriers first to ensure timely pickup.`;
          actionBtn = {
            label: 'Review Overview Dashboard',
            tab: 'overview',
          };
        }
      } else {
        responseText = `Based on current platform telemetry:\n• Total Registered Lots: ${donations.length}\n• Available Meals: ${stats.availableMeals}\n• Meals Redistributed: ${stats.mealsRedistributed}\n• Active Shelters: ${stats.ngosActiveCount} of ${stats.registeredNGOsCount}\n• Courier Fleet: ${volunteers.length} registered\n\nTry asking about urgent deadlines, unassigned couriers, or top NGO recommendations!`;
      }

      const botMsg: Message = {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionButton: actionBtn,
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-[#0e3b24] text-white p-5 rounded-2xl shadow-sm border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Bot className="w-4 h-4 text-emerald-300" />
            </span>
            <h2 className="text-lg font-bold">FoodBridge AI Operational Intelligence Assistant</h2>
          </div>
          <p className="text-xs text-emerald-200/90 max-w-2xl leading-relaxed">
            Rule-based real-time analysis answering operational inquiries, highlighting critical deadlines, and validating courier dispatch bottlenecks without external API keys.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-emerald-950/60 px-3.5 py-2 rounded-xl border border-emerald-800 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-300 font-mono">Zero API Keys Required • Pure Deterministic</span>
        </div>
      </div>

      {/* Main Assistant Chat Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col h-[520px]">
        {/* Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((m) => {
            const isBot = m.sender === 'assistant';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-2xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-xs font-bold ${
                    isBot
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs space-y-2 shadow-2xs ${
                    isBot
                      ? 'bg-white text-slate-800 border border-slate-200/80'
                      : 'bg-emerald-700 text-white'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                  
                  {m.actionButton && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          if (m.actionButton?.extraAction) m.actionButton.extraAction();
                          if (m.actionButton?.tab) setActiveTab(m.actionButton.tab);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>{m.actionButton.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <span
                    className={`block text-[10px] text-right font-mono ${
                      isBot ? 'text-slate-400' : 'text-emerald-200'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="px-5 py-2.5 bg-slate-100/60 border-t border-slate-200/70 overflow-x-auto flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Quick Prompts:
          </span>
          {PRESET_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => handleQuery(q)}
              className="px-3 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-600 rounded-lg border border-slate-200 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQuery(inputQuery);
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about urgent deadlines, courier status, or NGO recommendations..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim()}
            className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Production AI Integration Architecture Callout */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1.5">
        <span className="font-bold text-slate-900 block flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          Production Gemini Integration Roadmap Note:
        </span>
        <p className="leading-relaxed">
          In this client-side hackathon prototype, the assistant is executed locally through deterministic operational state queries without exposing secret API keys. When connected to a backend, this interface mounts to a server-side proxy route calling <code className="text-emerald-800 font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-slate-200">@google/genai</code> with Gemini 2.5 Flash, providing grounded operational reasoning while preserving deterministic eligibility checks.
        </p>
      </div>
    </div>
  );
};
