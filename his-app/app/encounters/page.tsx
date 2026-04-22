'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Activity, Edit2, Trash2, Clock, User, MapPin, Stethoscope } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deleteEncounter, Encounter } from '@/lib/api';
import EncounterModal from '@/components/EncounterModal';
import { useHIS } from '@/context/HISContext';

const STATUS_COLORS: Record<string, string> = {
  'in-progress': 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/30',
  'finished': 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-400',
  'planned': 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30',
  'cancelled': 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-400/10 dark:text-red-400',
  'arrived': 'bg-yellow-50 text-yellow-700 ring-yellow-600/10 dark:bg-yellow-400/10 dark:text-yellow-400',
  'triaged': 'bg-orange-50 text-orange-700 ring-orange-600/10 dark:bg-orange-400/10 dark:text-orange-400',
};

const CLASS_LABELS: Record<string, string> = {
  AMB: 'OPD', EMER: 'Emergency', IMP: 'IPD', OBSENC: 'Observation', SS: 'Short Stay',
};

function formatDt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function EncountersPage() {
  const { encounters, encountersLoading, fetchEncounters, refreshEncounters } = useHIS();

  const [patientFilter, setPatientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [encounterToEdit, setEncounterToEdit] = useState<Encounter | null>(null);

  // Re-fetch whenever filters change
  useEffect(() => {
    fetchEncounters(patientFilter || undefined, statusFilter || undefined);
  }, [patientFilter, statusFilter, fetchEncounters]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this encounter?')) return;
    try {
      await deleteEncounter(id);
      toast.success('Encounter deleted');
      refreshEncounters();
    } catch {
      toast.error('Failed to delete encounter');
    }
  };

  return (
    <div className="flex h-full flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Encounters</h1>
          <p className="mt-1 text-sm text-[var(--sidebar-fg)]">Clinical visits — OPD, IPD, Emergency, and more.</p>
        </div>
        <button
          onClick={() => { setEncounterToEdit(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all duration-200"
        >
          <Plus size={18} /> New Encounter
        </button>
      </div>

      {/* Main card */}
      <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-sm overflow-hidden flex flex-col">

        {/* Filters */}
        <div className="border-b border-[var(--border)] px-6 py-4 flex flex-wrap items-center gap-4 glass">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={patientFilter}
              onChange={e => setPatientFilter(e.target.value)}
              placeholder="Filter by Patient ID…"
              className="block w-full rounded-lg border border-[var(--border)] bg-transparent py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
          >
            <option value="">All Statuses</option>
            {['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          {encountersLoading ? (
            <div className="flex h-full items-center justify-center text-[var(--sidebar-fg)]">Loading encounters…</div>
          ) : encounters.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-full bg-[var(--sidebar-active)] p-6 mb-4 text-[var(--sidebar-fg)]">
                <Activity size={32} />
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)]">No encounters found</h3>
              <p className="text-sm text-[var(--sidebar-fg)] mt-1">Create a new encounter to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {encounters.map(enc => {
                const classCode = enc.class?.code ?? '';
                const classLabel = CLASS_LABELS[classCode] ?? classCode;
                const status = enc.status ?? 'unknown';
                const statusCls = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600 ring-gray-500/20';
                const patientRef = enc.subject?.reference?.split('/').pop() ?? '—';
                const doctor = enc.participant?.[0]?.individual?.display;
                const ward = enc.location?.[0]?.location?.display;
                const reason = enc.reasonCode?.[0]?.text ?? enc.reasonCode?.[0]?.coding?.[0]?.display;
                const typeText = enc.type?.[0]?.text ?? enc.type?.[0]?.coding?.[0]?.display;

                return (
                  <div onClick={() => { setEncounterToEdit(enc); setIsModalOpen(true); }} key={enc.id} className="group relative rounded-xl border border-[var(--border)] p-5 hover:border-primary/50 hover:shadow-md transition-all duration-200 hover">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--sidebar-active)] text-primary flex-shrink-0">
                          <Activity size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-[var(--foreground)] text-base">{classLabel}</span>
                            {typeText && <span className="text-sm text-[var(--sidebar-fg)]">· {typeText}</span>}
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusCls}`}>
                              {status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2 text-sm">
                            <div className="flex items-center gap-1.5 text-[var(--sidebar-fg)]">
                              <User size={13} />
                              <span className="truncate">Patient: <span className="text-[var(--foreground)] font-mono text-xs">{patientRef}</span></span>
                            </div>
                            {doctor && (
                              <div className="flex items-center gap-1.5 text-[var(--sidebar-fg)]">
                                <Stethoscope size={13} />
                                <span className="truncate">{doctor}</span>
                              </div>
                            )}
                            {ward && (
                              <div className="flex items-center gap-1.5 text-[var(--sidebar-fg)]">
                                <MapPin size={13} />
                                <span className="truncate">{ward}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-[var(--sidebar-fg)]">
                              <Clock size={13} />
                              <span>{formatDt(enc.period?.start)}</span>
                            </div>
                            {enc.period?.end && (
                              <div className="flex items-center gap-1.5 text-[var(--sidebar-fg)]">
                                <Clock size={13} />
                                <span>End: {formatDt(enc.period.end)}</span>
                              </div>
                            )}
                          </div>
                          {reason && (
                            <p className="mt-2 text-sm text-[var(--sidebar-fg)] italic truncate">Reason: {reason}</p>
                          )}
                        </div>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setEncounterToEdit(enc); setIsModalOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-primary rounded-md hover:bg-[var(--sidebar-active)] transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(enc.id as string)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <EncounterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        encounterToEdit={encounterToEdit}
        onSuccess={refreshEncounters}
      />
    </div>
  );
}
