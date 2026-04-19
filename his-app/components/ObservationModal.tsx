'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Observation, createObservation, updateObservation } from '@/lib/api';

interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  observationToEdit?: Observation | null;
  onSuccess: () => void;
}

const OBS_STATUS = ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled'];

const LOINC_PRESETS = [
  { code: '8867-4', display: 'Heart rate', unit: '/min' },
  { code: '9279-1', display: 'Respiratory rate', unit: '/min' },
  { code: '8480-6', display: 'Systolic blood pressure', unit: 'mmHg' },
  { code: '8462-4', display: 'Diastolic blood pressure', unit: 'mmHg' },
  { code: '8310-5', display: 'Body temperature', unit: '°C' },
  { code: '2708-6', display: 'Oxygen saturation (SpO2)', unit: '%' },
  { code: '29463-7', display: 'Body weight', unit: 'kg' },
  { code: '8302-2', display: 'Body height', unit: 'cm' },
  { code: '55284-4', display: 'Blood pressure panel', unit: '' },
  { code: 'custom', display: 'Custom / Other', unit: '' },
];

const LOINC_SYSTEM = 'http://loinc.org';
const OBS_CATEGORY_SYSTEM = 'http://terminology.hl7.org/CodeSystem/observation-category';

interface ComponentRow { code: string; display: string; value: string; unit: string }

const emptyForm = {
  patientId: '',
  encounterId: '',
  status: 'final',
  loincCode: '8867-4',
  customCode: '',
  customDisplay: '',
  effectiveDateTime: '',
  valueType: 'quantity' as 'quantity' | 'string',
  valueNumber: '',
  valueUnit: '/min',
  valueString: '',
  note: '',
};

export default function ObservationModal({ isOpen, onClose, observationToEdit, onSuccess }: ObservationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [components, setComponents] = useState<ComponentRow[]>([]);

  useEffect(() => {
    if (observationToEdit) {
      const patientRef = observationToEdit.subject?.reference ?? '';
      const encRef = observationToEdit.encounter?.reference ?? '';
      const obsCode = observationToEdit.code?.coding?.[0]?.code ?? 'custom';
      const preset = LOINC_PRESETS.find(p => p.code === obsCode);
      const hasQty = !!observationToEdit.valueQuantity;

      setFormData({
        patientId: patientRef.split('/').pop() ?? patientRef,
        encounterId: encRef.split('/').pop() ?? encRef,
        status: observationToEdit.status ?? 'final',
        loincCode: preset ? obsCode : 'custom',
        customCode: preset ? '' : obsCode,
        customDisplay: observationToEdit.code?.text ?? observationToEdit.code?.coding?.[0]?.display ?? '',
        effectiveDateTime: observationToEdit.effectiveDateTime?.slice(0, 16) ?? '',
        valueType: hasQty ? 'quantity' : 'string',
        valueNumber: observationToEdit.valueQuantity?.value?.toString() ?? '',
        valueUnit: observationToEdit.valueQuantity?.unit ?? preset?.unit ?? '',
        valueString: observationToEdit.valueString ?? '',
        note: observationToEdit.note?.[0]?.text ?? '',
      });

      setComponents(
        (observationToEdit.component ?? []).map(c => ({
          code: c.code?.coding?.[0]?.code ?? '',
          display: c.code?.text ?? c.code?.coding?.[0]?.display ?? '',
          value: c.valueQuantity?.value?.toString() ?? c.valueString ?? '',
          unit: c.valueQuantity?.unit ?? '',
        }))
      );
    } else {
      setFormData(emptyForm);
      setComponents([]);
    }
  }, [observationToEdit, isOpen]);

  if (!isOpen) return null;

  const f = formData;
  const set = (key: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const selectedPreset = LOINC_PRESETS.find(p => p.code === f.loincCode);
  const isCustom = f.loincCode === 'custom';

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const preset = LOINC_PRESETS.find(p => p.code === code);
    setFormData(prev => ({ ...prev, loincCode: code, valueUnit: preset?.unit ?? prev.valueUnit }));
  };

  const addComponent = () => setComponents(prev => [...prev, { code: '', display: '', value: '', unit: '' }]);
  const removeComponent = (i: number) => setComponents(prev => prev.filter((_, idx) => idx !== i));
  const updateComponent = (i: number, field: keyof ComponentRow, val: string) =>
    setComponents(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const obsCode = isCustom ? f.customCode : f.loincCode;
      const obsDisplay = isCustom ? f.customDisplay : selectedPreset?.display ?? '';

      const payload: Observation = {
        resourceType: 'Observation',
        status: f.status,
        category: [{
          coding: [{ system: OBS_CATEGORY_SYSTEM, code: 'vital-signs', display: 'Vital Signs' }],
        }],
        code: {
          coding: [{ system: LOINC_SYSTEM, code: obsCode, display: obsDisplay }],
          text: obsDisplay,
        },
        subject: f.patientId ? { reference: `Patient/${f.patientId}` } : undefined,
        encounter: f.encounterId ? { reference: `Encounter/${f.encounterId}` } : undefined,
        effectiveDateTime: f.effectiveDateTime ? `${f.effectiveDateTime}:00+07:00` : undefined,
        ...(f.valueType === 'quantity' && f.valueNumber !== ''
          ? {
              valueQuantity: {
                value: parseFloat(f.valueNumber),
                unit: f.valueUnit || undefined,
                system: 'http://unitsofmeasure.org',
                code: f.valueUnit || undefined,
              },
            }
          : { valueString: f.valueString || undefined }),
        component: components.length > 0 ? components.map(c => ({
          code: {
            coding: [{ system: LOINC_SYSTEM, code: c.code, display: c.display }],
            text: c.display,
          },
          ...(c.unit
            ? { valueQuantity: { value: parseFloat(c.value), unit: c.unit, system: 'http://unitsofmeasure.org', code: c.unit } }
            : { valueString: c.value }),
        })) : undefined,
        note: f.note ? [{ text: f.note }] : undefined,
      };

      if (observationToEdit?.id) {
        await updateObservation(observationToEdit.id, payload);
        toast.success('Observation updated');
      } else {
        await createObservation(payload);
        toast.success('Observation recorded');
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save observation.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-[var(--foreground)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm';
  const selectCls = `${inputCls} appearance-none`;
  const labelCls = 'text-sm font-medium text-[var(--foreground)]';
  const sectionTitle = 'text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-fg)] col-span-full mt-2 pb-1 border-b border-[var(--border)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-[var(--card-bg)] shadow-xl border border-[var(--border)] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 flex-shrink-0">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {observationToEdit ? 'Edit Observation' : 'New Observation'}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-5">
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">

              {/* ── References ── */}
              <p className={sectionTitle}>References</p>

              <div className="space-y-1">
                <label className={labelCls}>Patient ID <span className="text-red-500">*</span></label>
                <input id="obs-patientId" type="text" required value={f.patientId} onChange={set('patientId')} className={inputCls} placeholder="Patient UUID" />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Encounter ID</label>
                <input id="obs-encounterId" type="text" value={f.encounterId} onChange={set('encounterId')} className={inputCls} placeholder="Encounter UUID (optional)" />
              </div>

              {/* ── Observation Code ── */}
              <p className={sectionTitle}>Observation Code (LOINC)</p>

              <div className="space-y-1 md:col-span-2">
                <label className={labelCls}>Observation Type <span className="text-red-500">*</span></label>
                <select id="obs-loinc" value={f.loincCode} onChange={handlePresetChange} className={selectCls}>
                  {LOINC_PRESETS.map(p => (
                    <option key={p.code} value={p.code}>{p.display} {p.code !== 'custom' ? `(${p.code})` : ''}</option>
                  ))}
                </select>
              </div>

              {isCustom && (
                <>
                  <div className="space-y-1">
                    <label className={labelCls}>Custom LOINC Code</label>
                    <input id="obs-customCode" type="text" value={f.customCode} onChange={set('customCode')} className={inputCls} placeholder="e.g. 2345-7" />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Display Name</label>
                    <input id="obs-customDisplay" type="text" value={f.customDisplay} onChange={set('customDisplay')} className={inputCls} placeholder="e.g. Glucose" />
                  </div>
                </>
              )}

              {/* ── Status & Date ── */}
              <p className={sectionTitle}>Status &amp; Date</p>

              <div className="space-y-1">
                <label className={labelCls}>Status <span className="text-red-500">*</span></label>
                <select id="obs-status" value={f.status} onChange={set('status')} className={selectCls}>
                  {OBS_STATUS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Effective Date &amp; Time</label>
                <input id="obs-effectiveDate" type="datetime-local" value={f.effectiveDateTime} onChange={set('effectiveDateTime')} className={inputCls} />
              </div>

              {/* ── Value ── */}
              <p className={sectionTitle}>Value</p>

              <div className="space-y-1 md:col-span-2">
                <label className={labelCls}>Value Type</label>
                <div className="flex gap-4">
                  {(['quantity', 'string'] as const).map(t => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer text-sm text-[var(--foreground)]">
                      <input type="radio" name="valueType" value={t} checked={f.valueType === t}
                        onChange={() => setFormData(p => ({ ...p, valueType: t }))} className="accent-primary" />
                      {t === 'quantity' ? 'Numeric (Quantity)' : 'Text (String)'}
                    </label>
                  ))}
                </div>
              </div>

              {f.valueType === 'quantity' ? (
                <>
                  <div className="space-y-1">
                    <label className={labelCls}>Value</label>
                    <input id="obs-valueNum" type="number" step="any" value={f.valueNumber} onChange={set('valueNumber')} className={inputCls} placeholder="e.g. 120" />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Unit</label>
                    <input id="obs-unit" type="text" value={f.valueUnit} onChange={set('valueUnit')} className={inputCls} placeholder="mmHg, /min, °C…" />
                  </div>
                </>
              ) : (
                <div className="space-y-1 md:col-span-2">
                  <label className={labelCls}>Value (text)</label>
                  <input id="obs-valueStr" type="text" value={f.valueString} onChange={set('valueString')} className={inputCls} placeholder="e.g. Positive" />
                </div>
              )}

              {/* ── Components (BP panel etc.) ── */}
              <p className={sectionTitle}>Components (e.g. Blood Pressure)</p>

              {components.map((comp, i) => (
                <div key={i} className="md:col-span-2 grid grid-cols-4 gap-2 items-end">
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--sidebar-fg)]">LOINC Code</label>
                    <input type="text" value={comp.code} onChange={e => updateComponent(i, 'code', e.target.value)} className={inputCls} placeholder="8480-6" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--sidebar-fg)]">Display</label>
                    <input type="text" value={comp.display} onChange={e => updateComponent(i, 'display', e.target.value)} className={inputCls} placeholder="Systolic BP" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--sidebar-fg)]">Value / Unit</label>
                    <div className="flex gap-1">
                      <input type="text" value={comp.value} onChange={e => updateComponent(i, 'value', e.target.value)} className={inputCls} placeholder="120" />
                      <input type="text" value={comp.unit} onChange={e => updateComponent(i, 'unit', e.target.value)} className={`${inputCls} w-20`} placeholder="mmHg" />
                    </div>
                  </div>
                  <button type="button" onClick={() => removeComponent(i)} className="p-2.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <div className="md:col-span-2">
                <button type="button" onClick={addComponent}
                  className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Plus size={14} /> Add component
                </button>
              </div>

              {/* ── Notes ── */}
              <p className={sectionTitle}>Notes</p>

              <div className="space-y-1 md:col-span-2">
                <label className={labelCls}>Clinical Notes</label>
                <textarea id="obs-note" rows={2} value={f.note} onChange={set('note')} className={`${inputCls} resize-none`} placeholder="Additional clinical notes…" />
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-[var(--border)] px-6 py-4 flex-shrink-0">
            <button type="button" onClick={onClose} className="rounded-lg px-5 py-2.5 text-sm font-medium text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-active)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : observationToEdit ? 'Save Changes' : 'Record Observation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
