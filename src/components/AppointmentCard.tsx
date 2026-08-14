"use client";

import { Calendar, Clock, MapPin, User, Stethoscope, CheckCircle2, ShieldCheck, QrCode, Building2, PhoneCall } from "lucide-react";
import { AppointmentRecord } from "@/lib/specialistTypes";

interface AppointmentCardProps {
  appointment: AppointmentRecord;
  onDismiss?: () => void;
}

export default function AppointmentCard({ appointment, onDismiss }: AppointmentCardProps) {
  return (
    <div className="w-full p-4 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border-2 border-indigo-500/50 shadow-2xl text-slate-100 font-sans space-y-3.5 animate-fadeIn">
      
      {/* Header with Token Number */}
      <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white">
                PHC OPD डॉक्टर अपॉइंटमेंट पुष्टीकृत
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ✓ Confirmed
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              राष्ट्रीय स्वास्थ्य मिशन (NHM) • प्राथमिक स्वास्थ्य केंद्र ओपीडी
            </p>
          </div>
        </div>

        {/* Token Badge */}
        <div className="text-right">
          <span className="text-[10px] text-indigo-300 uppercase font-extrabold block">टोकन नंबर</span>
          <span className="text-2xl font-black text-indigo-300 font-mono">
            #{appointment.token_number}
          </span>
        </div>
      </div>

      {/* Appointment Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        
        {/* Patient & Booking ID */}
        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[10.5px] text-slate-400 flex items-center gap-1 font-semibold">
            <User className="w-3.5 h-3.5 text-indigo-400" /> मरीज़ (Patient)
          </span>
          <div className="font-bold text-white text-sm">{appointment.patient_name}</div>
          <div className="text-[10.5px] text-slate-400 font-mono">{appointment.masked_phone} • ID: {appointment.appointment_id}</div>
        </div>

        {/* Doctor & Department */}
        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[10.5px] text-slate-400 flex items-center gap-1 font-semibold">
            <Stethoscope className="w-3.5 h-3.5 text-teal-400" /> चिकित्सक (Doctor)
          </span>
          <div className="font-bold text-teal-300 text-sm">{appointment.doctor_name}</div>
          <div className="text-[10.5px] text-slate-400">{appointment.department}</div>
        </div>

        {/* Date & Time Slot */}
        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[10.5px] text-slate-400 flex items-center gap-1 font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> दिनांक व समय (Slot)
          </span>
          <div className="font-bold text-amber-300">{appointment.appointment_date}</div>
          <div className="text-[10.5px] text-slate-400 font-mono">{appointment.time_slot}</div>
        </div>

        {/* Health Facility / PHC Address */}
        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[10.5px] text-slate-400 flex items-center gap-1 font-semibold">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" /> स्वास्थ्य केंद्र (PHC Centre)
          </span>
          <div className="font-bold text-emerald-300">{appointment.facility_name}</div>
          <div className="text-[10.5px] text-slate-400 truncate">{appointment.facility_address}</div>
        </div>

      </div>

      {/* Ayushman Bharat Guarantee Footer */}
      <div className="p-2.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 text-indigo-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span><strong>आयुष्मान भारत PM-JAY:</strong> ओपीडी परामर्श, पैथोलॉजी जांच एवं आवश्यक दवाएं पूर्णतः निःशुल्क हैं।</span>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition ml-2 shrink-0"
          >
            ओके (OK)
          </button>
        )}
      </div>

    </div>
  );
}
