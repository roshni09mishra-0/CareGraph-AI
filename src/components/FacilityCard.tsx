"use client";

import { HealthFacility } from "@/lib/facilityData";
import { TriageClassificationResult } from "@/lib/tools";
import { Hospital, MapPin, Phone, Ambulance, ShieldCheck, Clock, Navigation, CheckCircle, AlertTriangle, AlertCircle, X, Sparkles } from "lucide-react";

interface FacilityCardProps {
  facility?: HealthFacility | null;
  triage?: TriageClassificationResult | null;
  onClose?: () => void;
  language?: "hi" | "en" | "hinglish";
}

export default function FacilityCard({ facility, triage, onClose, language = "hi" }: FacilityCardProps) {
  if (!facility && !triage) return null;

  const isHindi = language === "hi" || language === "hinglish";

  return (
    <div className="w-full rounded-3xl border-2 border-teal-300 bg-gradient-to-br from-white via-teal-50/40 to-emerald-50/30 p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all duration-300 animate-fadeIn">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-teal-200/20 rounded-full blur-2xl pointer-events-none" />

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 border border-teal-100 transition shadow-sm"
          title="Close Facility Card"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-700 text-white text-[11px] font-extrabold shadow-sm">
          <Hospital className="w-3.5 h-3.5" />
          <span>{isHindi ? "🏥 लाइव स्वास्थ्य केंद्र व अस्पताल खोज (Day 5)" : "🏥 Live Verified Health Facility (Day 5)"}</span>
        </span>
        <span className="text-[11px] font-bold text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-full border border-teal-200">
          {isHindi ? "सत्यापित: 10 अगस्त 2026" : "Verified: 10 Aug 2026"}
        </span>
      </div>

      {/* Triage Urgency Banner (If Triage Computed) */}
      {triage && (
        <div className={`mb-4 p-3.5 rounded-2xl border flex items-start gap-3 shadow-sm ${
          triage.triageLevel === 1 
            ? "bg-rose-50 border-rose-300 text-rose-950" 
            : triage.triageLevel === 2
            ? "bg-amber-50 border-amber-300 text-amber-950"
            : "bg-emerald-50 border-emerald-300 text-emerald-950"
        }`}>
          {triage.triageLevel === 1 ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : triage.triageLevel === 2 ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <span className="font-extrabold text-xs block">
              {triage.urgencyLabel}
            </span>
            <p className="text-[11.5px] font-medium leading-relaxed">
              {triage.recommendedAction}
            </p>
          </div>
        </div>
      )}

      {/* Facility Details */}
      {facility && (
        <div className="space-y-4">
          
          {/* Facility Name & Distance Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-300">
                  {facility.facility_type}
                </span>
                {facility.ayushman_pmjay_empaneled && (
                  <span className="flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Ayushman PM-JAY</span>
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                {facility.name}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-teal-800 text-white font-extrabold text-xs shadow-md self-start sm:self-auto">
              <Navigation className="w-3.5 h-3.5 text-teal-300" />
              <span>{facility.distance_km} km {isHindi ? "दूरी" : "Away"}</span>
            </div>
          </div>

          {/* Location & Address */}
          <div className="flex items-start gap-2.5 text-xs text-slate-700">
            <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <span>{facility.address}, {facility.district}, {facility.state} - {facility.pincode}</span>
          </div>

          {/* Operating Hours & 24x7 Status */}
          <div className="flex items-center gap-2.5 text-xs text-slate-700">
            <Clock className="w-4 h-4 text-teal-700 shrink-0" />
            <span className="font-semibold">{isHindi ? "कार्य समय:" : "Hours:"}</span>
            <span className="text-teal-900 font-bold">{facility.operating_hours}</span>
          </div>

          {/* Services Offered Tags */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isHindi ? "उपलब्ध चिकित्सा सेवाएं:" : "Available Clinical Services:"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {facility.services.map((svc, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-[11px] font-semibold text-slate-700 shadow-2xs"
                >
                  ✓ {svc}
                </span>
              ))}
            </div>
          </div>

          {/* Action Helplines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <a
              href={`tel:${facility.emergency_helpline}`}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-900 text-xs font-extrabold shadow-sm transition transform active:scale-95"
            >
              <Phone className="w-3.5 h-3.5 text-teal-700" />
              <span>{isHindi ? "हेल्पलाइन:" : "Hospital:"} {facility.emergency_helpline}</span>
            </a>

            <a
              href="tel:108"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-extrabold shadow-md shadow-rose-600/20 transition transform active:scale-95"
            >
              <Ambulance className="w-4 h-4" />
              <span>{isHindi ? "108 एम्बुलेंस आपातकाल" : "Dial 108 Ambulance"}</span>
            </a>
          </div>

        </div>
      )}

    </div>
  );
}
