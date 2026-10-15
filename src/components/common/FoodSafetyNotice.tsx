import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Thermometer, Clock, Sparkles } from 'lucide-react';

export const FoodSafetyNotice: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [expanded, setExpanded] = useState(!compact);

  return (
    <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4 text-slate-800 text-xs shadow-xs transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-amber-950 text-sm">Food Safety & Hygiene Protocol</span>
            <span className="ml-2 text-amber-800 hidden sm:inline">• FSSAI & Good Samaritan Act Standards</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-amber-800 hover:text-amber-950 flex items-center gap-1 font-medium cursor-pointer"
        >
          {expanded ? (
            <>
              <span>Hide Details</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>View Safety Guidelines</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-amber-200/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-700 leading-normal">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 block">Strict 4-Hour Rule:</span>
              Cooked hot surplus meals must be collected and served within 4 hours of preparation or kept chilled under 4°C.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Thermometer className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 block">Thermal Storage:</span>
              Hot food held above 60°C; dairy/meat immediately sealed and chilled below 4°C in food-grade vessels.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 block">Inspection on Handover:</span>
              Recipient NGOs conduct sensory check (appearance, aroma, temperature) before final distribution.
            </div>
          </div>
          <div className="md:col-span-3 text-[11px] text-amber-900/80 bg-amber-100/60 p-2 rounded-lg mt-1 italic">
            * Note: FoodBridge AI facilitates coordination. Donors and recipient organizations remain responsible for verifying food safety, labeling allergens, and abiding by local sanitary health regulations.
          </div>
        </div>
      )}
    </div>
  );
};
