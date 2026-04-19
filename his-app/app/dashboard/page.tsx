'use client'

import React, { useState } from 'react'
import Link from 'next/link';
import { 
  Users, Activity, FileText, ChevronRight, UserCircle, 
  MapPin, Stethoscope, Clock, Thermometer 
} from 'lucide-react';

import EncounterModal from '@/components/EncounterModal';
import PatientModal from '@/components/PatientModal';
import ObservationModal from '@/components/ObservationModal';

import { useHIS } from '@/context/HISContext';
import { Patient, Encounter, Observation } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  'in-progress': 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/30',
  'finished': 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-400',
  'planned': 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30',
  'cancelled': 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-400/10 dark:text-red-400',
  'arrived': 'bg-yellow-50 text-yellow-700 ring-yellow-600/10 dark:bg-yellow-400/10 dark:text-yellow-400',
  'triaged': 'bg-orange-50 text-orange-700 ring-orange-600/10 dark:bg-orange-400/10 dark:text-orange-400',
  'final': 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/30',
  'preliminary': 'bg-yellow-50 text-yellow-700 ring-yellow-600/10 dark:bg-yellow-400/10 dark:text-yellow-400',
  'amended': 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30',
  'registered': 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-400',
};

const CLASS_LABELS: Record<string, string> = {
  AMB: 'OPD', EMER: 'Emergency', IMP: 'IPD', OBSENC: 'Observation', SS: 'Short Stay',
};

const LOINC_ICONS: Record<string, React.ReactNode> = {
  '8867-4': <Activity size={16} />,
  '8310-5': <Thermometer size={16} />,
};

function formatDt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
}

function getObsValue(obs: Observation): string {
  if (obs.valueQuantity) {
    return `${obs.valueQuantity.value ?? ''}${obs.valueQuantity.unit ? ' ' + obs.valueQuantity.unit : ''}`.trim();
  }
  if (obs.valueString) return obs.valueString;
  if (obs.valueCodeableConcept) {
    return obs.valueCodeableConcept.text ?? obs.valueCodeableConcept.coding?.[0]?.display ?? '—';
  }
  if (obs.component && obs.component.length > 0) {
    return obs.component
      .map(c => {
        const val = c.valueQuantity ? `${c.valueQuantity.value ?? ''} ${c.valueQuantity.unit ?? ''}`.trim() : c.valueString ?? '';
        return val;
      })
      .join(' / ');
  }
  return '—';
}

export default function DashboardPage() {
  const { 
    patients, refreshPatients,
    encounters, refreshEncounters,
    observations, refreshObservations,
    counts 
  } = useHIS();

  // Modals state
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [encounterToEdit, setEncounterToEdit] = useState<Encounter | null>(null);
  const [obsToEdit, setObsToEdit] = useState<Observation | null>(null);

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isEncounterModalOpen, setIsEncounterModalOpen] = useState(false);
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);

  const handlePatientClick = (p: Patient) => {
    setPatientToEdit(p);
    setIsPatientModalOpen(true);
  };

  const handleEncounterClick = (e: Encounter) => {
    setEncounterToEdit(e);
    setIsEncounterModalOpen(true);
  };

  const handleObsClick = (o: Observation) => {
    setObsToEdit(o);
    setIsObsModalOpen(true);
  };

  return (
    <div className='flex h-full flex-col p-8 bg-[var(--background)] overflow-y-auto'>
      {/* Header */}
      <div className="flex items-center justify-between pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">HIS Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--sidebar-fg)]">Overview of hospital operations and recent records.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--sidebar-fg)]">Total Patients</p>
            <h3 className="text-2xl font-bold text-[var(--foreground)]">{counts.patients}</h3>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--sidebar-fg)]">Total Encounters</p>
            <h3 className="text-2xl font-bold text-[var(--foreground)]">{counts.encounters}</h3>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
            <FileText size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--sidebar-fg)]">Total Observations</p>
            <h3 className="text-2xl font-bold text-[var(--foreground)]">{counts.observations}</h3>
          </div>
        </div>
      </div>

      {/* 3-Column Recent Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Recent Patients ── */}
        <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border)] bg-[var(--sidebar-active)]/30">
            <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Users size={18} className="text-primary"/> Recent Patients
            </h2>
            <Link href="/patients" className="text-xs font-medium text-primary hover:underline flex items-center">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex-1 divide-y divide-[var(--border)]">
            {patients.slice(0, 5).map(p => {
               const name = p.name?.[0];
               const fullName = `${name?.given?.join(' ') || ''} ${name?.family || ''}`.trim() || 'Unknown Name';
               return (
                 <div key={p.id} onClick={() => handlePatientClick(p)} className="px-5 py-3 hover:bg-[var(--sidebar-active)]/50 cursor-pointer transition-colors flex items-center gap-3">
                    <UserCircle size={28} className="text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{fullName}</p>
                      <p className="text-xs text-[var(--sidebar-fg)] truncate">ID: {p.identifier?.[0]?.value || '—'} · {p.gender}</p>
                    </div>
                 </div>
               )
            })}
            {patients.length === 0 && <p className="p-5 text-sm text-[var(--sidebar-fg)] text-center">No patients registered.</p>}
          </div>
        </div>

        {/* ── Recent Encounters ── */}
        <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border)] bg-[var(--sidebar-active)]/30">
            <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Activity size={18} className="text-green-500"/> Recent Encounters
            </h2>
            <Link href="/encounters" className="text-xs font-medium text-green-600 hover:underline flex items-center">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex-1 divide-y divide-[var(--border)]">
            {encounters.slice(0, 5).map(enc => {
                const classCode = enc.class?.code ?? '';
                const classLabel = CLASS_LABELS[classCode] ?? classCode;
                const statusCls = STATUS_COLORS[enc.status ?? 'unknown'] ?? 'bg-gray-100 text-gray-600';
                
                return (
                  <div key={enc.id} onClick={() => handleEncounterClick(enc)} className="px-5 py-3 hover:bg-[var(--sidebar-active)]/50 cursor-pointer transition-colors flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--foreground)] truncate">{classLabel} Visit</span>
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusCls}`}>
                        {enc.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--sidebar-fg)]">
                      <Clock size={12}/> <span className="truncate">{formatDt(enc.period?.start)}</span>
                    </div>
                  </div>
                )
            })}
            {encounters.length === 0 && <p className="p-5 text-sm text-[var(--sidebar-fg)] text-center">No encounters found.</p>}
          </div>
        </div>

        {/* ── Recent Observations ── */}
        <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border)] bg-[var(--sidebar-active)]/30">
            <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <FileText size={18} className="text-orange-500"/> Recent Observations
            </h2>
            <Link href="/observations" className="text-xs font-medium text-orange-600 hover:underline flex items-center">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex-1 divide-y divide-[var(--border)]">
            {observations.slice(0, 5).map(obs => {
                const code = obs.code?.coding?.[0]?.code ?? '';
                const display = obs.code?.text ?? obs.code?.coding?.[0]?.display ?? code ?? 'Unknown';
                const icon = LOINC_ICONS[code] ?? <FileText size={16} />;
                const value = getObsValue(obs);
                const statusCls = STATUS_COLORS[obs.status ?? 'final'] ?? 'bg-gray-100 text-gray-600';

                return (
                  <div key={obs.id} onClick={() => handleObsClick(obs)} className="px-5 py-3 hover:bg-[var(--sidebar-active)]/50 cursor-pointer transition-colors flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--sidebar-active)] text-orange-500">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--foreground)] truncate">{display}</span>
                        <span className="text-sm font-bold text-[var(--foreground)]">{value}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-0.5">
                        <span className="text-[var(--sidebar-fg)]">{formatDt(obs.effectiveDateTime)}</span>
                        <span className={`inline-flex items-center rounded-md px-1 py-0.5 font-medium ring-1 ring-inset ${statusCls}`}>
                          {obs.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )
            })}
            {observations.length === 0 && <p className="p-5 text-sm text-[var(--sidebar-fg)] text-center">No observations found.</p>}
          </div>
        </div>

      </div>

      {/* Modals */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        patientToEdit={patientToEdit}
        onSuccess={refreshPatients}
      />
      
      <EncounterModal
        isOpen={isEncounterModalOpen}
        onClose={() => setIsEncounterModalOpen(false)}
        encounterToEdit={encounterToEdit}
        onSuccess={refreshEncounters}
      />

      <ObservationModal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
        observationToEdit={obsToEdit}
        onSuccess={refreshObservations}
      />

    </div>
  )
}