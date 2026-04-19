'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, FileText, Edit2, Trash2, Clock, User, Activity, Thermometer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deleteObservation, Observation } from '@/lib/api';
import ObservationModal from '@/components/ObservationModal';
import { useHIS } from '@/context/HISContext';

const STATUS_COLORS: Record<string, string> = {
  'final': 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/30',
  'preliminary': 'bg-yellow-50 text-yellow-700 ring-yellow-600/10 dark:bg-yellow-400/10 dark:text-yellow-400',
  'amended': 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30',
  'registered': 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-400',
  'cancelled': 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-400/10 dark:text-red-400',
};

const LOINC_ICONS: Record<string, React.ReactNode> = {
  '8867-4': <Activity size={18} />,
  '8310-5': <Thermometer size={18} />,
};

function formatDt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

function getObsValue(obs: Observation): string {
  if (obs.valueQuantity) {
    const v = obs.valueQuantity;
    return `${v.value ?? ''}${v.unit ? ' ' + v.unit : ''}`.trim();
  }
  if (obs.valueString) return obs.valueString;
  if (obs.valueCodeableConcept) {
    return obs.valueCodeableConcept.text ?? obs.valueCodeableConcept.coding?.[0]?.display ?? '—';
  }
  if (obs.component && obs.component.length > 0) {
    return obs.component
      .map(c => {
        const lbl = c.code?.text ?? c.code?.coding?.[0]?.display ?? '';
        const val = c.valueQuantity
          ? `${c.valueQuantity.value ?? ''} ${c.valueQuantity.unit ?? ''}`.trim()
          : c.valueString ?? '';
        return `${lbl}: ${val}`;
      })
      .join(' / ');
  }
  return '—';
}

export default function ObservationsPage() {
  const { observations, observationsLoading, fetchObservations, refreshObservations } = useHIS();

  const [patientFilter, setPatientFilter] = useState('');
  const [encounterFilter, setEncounterFilter] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [obsToEdit, setObsToEdit] = useState<Observation | null>(null);

  // Re-fetch whenever filters change
  useEffect(() => {
    fetchObservations(
      patientFilter || undefined,
      encounterFilter || undefined,
      codeFilter || undefined,
    );
  }, [patientFilter, encounterFilter, codeFilter, fetchObservations]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this observation?')) return;
    try {
      await deleteObservation(id);
      toast.success('Observation deleted');
      refreshObservations();
    } catch {
      toast.error('Failed to delete observation');
    }
  };

  return (
    <div className="flex h-full flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Observations</h1>
          <p className="mt-1 text-sm text-[var(--sidebar-fg)]">Vital signs, lab results, and clinical findings.</p>
        </div>
        <button
          onClick={() => { setObsToEdit(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all duration-200"
        >
          <Plus size={18} /> New Observation
        </button>
      </div>

      {/* Main card */}
      <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-sm overflow-hidden flex flex-col">

        {/* Filters */}
        <div className="border-b border-[var(--border)] px-6 py-4 flex flex-wrap items-center gap-4 glass">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="pointer-events-none absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={patientFilter}
              onChange={e => setPatientFilter(e.target.value)}
              placeholder="Patient ID…"
              className="block w-full rounded-lg border border-[var(--border)] bg-transparent py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="pointer-events-none absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={encounterFilter}
              onChange={e => setEncounterFilter(e.target.value)}
              placeholder="Encounter ID…"
              className="block w-full rounded-lg border border-[var(--border)] bg-transparent py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="relative flex-1 min-w-[140px] max-w-[200px]">
            <input
              type="text"
              value={codeFilter}
              onChange={e => setCodeFilter(e.target.value)}
              placeholder="LOINC code…"
              className="block w-full rounded-lg border border-[var(--border)] bg-transparent py-2 px-3 text-sm placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {observationsLoading ? (
            <div className="flex h-full items-center justify-center text-[var(--sidebar-fg)] p-12">Loading observations…</div>
          ) : observations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-12">
              <div className="rounded-full bg-[var(--sidebar-active)] p-6 mb-4 text-[var(--sidebar-fg)]">
                <FileText size={32} />
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)]">No observations found</h3>
              <p className="text-sm text-[var(--sidebar-fg)] mt-1">Record the first observation using the button above.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--sidebar-active)]/40">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-fg)]">Observation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-fg)]">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-fg)]">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-fg)]">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-fg)]">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-fg)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {observations.map(obs => {
                  const code = obs.code?.coding?.[0]?.code ?? '';
                  const display = obs.code?.text ?? obs.code?.coding?.[0]?.display ?? code ?? 'Unknown';
                  const status = obs.status ?? 'unknown';
                  const statusCls = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600 ring-gray-500/20';
                  const patientRef = obs.subject?.reference?.split('/').pop() ?? '—';
                  const encRef = obs.encounter?.reference?.split('/').pop();
                  const value = getObsValue(obs);
                  const icon = LOINC_ICONS[code] ?? <FileText size={18} />;

                  return (
                    <tr key={obs.id} className="group hover:bg-[var(--sidebar-active)]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sidebar-active)] text-primary flex-shrink-0">
                            {icon}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--foreground)] truncate max-w-[180px]">{display}</p>
                            {code && <p className="text-xs text-[var(--sidebar-fg)] font-mono">{code}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-[var(--foreground)]">{value}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusCls}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-[var(--sidebar-fg)]">
                          <User size={13} />
                          <span className="font-mono text-xs text-[var(--foreground)] truncate max-w-[100px]">{patientRef}</span>
                        </div>
                        {encRef && (
                          <div className="flex items-center gap-1.5 text-[var(--sidebar-fg)] mt-0.5">
                            <Activity size={13} />
                            <span className="font-mono text-xs truncate max-w-[100px]">{encRef}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-[var(--sidebar-fg)]">
                          <Clock size={13} />
                          <span className="text-xs">{formatDt(obs.effectiveDateTime)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setObsToEdit(obs); setIsModalOpen(true); }}
                            className="p-1.5 text-gray-400 hover:text-primary rounded-md hover:bg-[var(--sidebar-active)] transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(obs.id as string)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ObservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        observationToEdit={obsToEdit}
        onSuccess={refreshObservations}
      />
    </div>
  );
}
