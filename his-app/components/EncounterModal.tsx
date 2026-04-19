'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Encounter, createEncounter, updateEncounter } from '@/lib/api';

interface EncounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  encounterToEdit?: Encounter | null;
  onSuccess: () => void;
}

const ENCOUNTER_STATUS = ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled'];
const ENCOUNTER_CLASS = [
  { code: 'AMB', display: 'Ambulatory (OPD)' },
  { code: 'EMER', display: 'Emergency' },
  { code: 'IMP', display: 'Inpatient (IPD)' },
  { code: 'OBSENC', display: 'Observation' },
  { code: 'SS', display: 'Short Stay' },
];
const CLASS_SYSTEM = 'http://terminology.hl7.org/CodeSystem/v3-ActCode';

const emptyForm = {
  patientId: '',
  status: 'in-progress',
  encounterClass: 'AMB',
  typeCode: '',
  typeDisplay: '',
  periodStart: '',
  periodEnd: '',
  doctorDisplay: '',
  ward: '',
  reasonText: '',
  admitSource: '',
  dischargeDisposition: '',
};

export default function EncounterModal({ isOpen, onClose, encounterToEdit, onSuccess }: EncounterModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (encounterToEdit) {
      const subjectRef = encounterToEdit.subject?.reference ?? '';
      const patientId = subjectRef.split('/').pop() ?? subjectRef;
      const cls = ENCOUNTER_CLASS.find(c => c.code === encounterToEdit.class?.code);

      setFormData({
        patientId,
        status: encounterToEdit.status ?? 'in-progress',
        encounterClass: encounterToEdit.class?.code ?? 'AMB',
        typeCode: encounterToEdit.type?.[0]?.coding?.[0]?.code ?? '',
        typeDisplay: encounterToEdit.type?.[0]?.text ?? encounterToEdit.type?.[0]?.coding?.[0]?.display ?? '',
        periodStart: encounterToEdit.period?.start?.slice(0, 16) ?? '',
        periodEnd: encounterToEdit.period?.end?.slice(0, 16) ?? '',
        doctorDisplay: encounterToEdit.participant?.[0]?.individual?.display ?? '',
        ward: encounterToEdit.location?.[0]?.location?.display ?? '',
        reasonText: encounterToEdit.reasonCode?.[0]?.text ?? encounterToEdit.reasonCode?.[0]?.coding?.[0]?.display ?? '',
        admitSource: encounterToEdit.hospitalization?.admitSource?.text ?? '',
        dischargeDisposition: encounterToEdit.hospitalization?.dischargeDisposition?.text ?? '',
      });
      void cls;
    } else {
      setFormData(emptyForm);
    }
  }, [encounterToEdit, isOpen]);

  if (!isOpen) return null;

  const f = formData;
  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cls = ENCOUNTER_CLASS.find(c => c.code === f.encounterClass)!;
      const payload: Encounter = {
        resourceType: 'Encounter',
        status: f.status,
        class: { system: CLASS_SYSTEM, code: cls.code, display: cls.display },
        subject: f.patientId ? { reference: `Patient/${f.patientId}` } : undefined,
        type: f.typeCode || f.typeDisplay ? [{
          coding: f.typeCode ? [{ code: f.typeCode, display: f.typeDisplay || undefined }] : undefined,
          text: f.typeDisplay || undefined,
        }] : undefined,
        period: f.periodStart || f.periodEnd ? {
          start: f.periodStart ? `${f.periodStart}:00+07:00` : undefined,
          end: f.periodEnd ? `${f.periodEnd}:00+07:00` : undefined,
        } : undefined,
        participant: f.doctorDisplay ? [{
          individual: { display: f.doctorDisplay },
        }] : undefined,
        location: f.ward ? [{ location: { display: f.ward } }] : undefined,
        reasonCode: f.reasonText ? [{ text: f.reasonText }] : undefined,
        hospitalization: f.admitSource || f.dischargeDisposition ? {
          admitSource: f.admitSource ? { text: f.admitSource } : undefined,
          dischargeDisposition: f.dischargeDisposition ? { text: f.dischargeDisposition } : undefined,
        } : undefined,
      };

      if (encounterToEdit?.id) {
        await updateEncounter(encounterToEdit.id, payload);
        toast.success('Encounter updated successfully');
      } else {
        await createEncounter(payload);
        toast.success('Encounter created successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save encounter';
      console.error('[EncounterModal]', err);
      toast.error(msg, { duration: 6000 });
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
            {encounterToEdit ? 'Edit Encounter' : 'New Encounter'}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-5">
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">

              {/* ── References ── */}
              <p className={sectionTitle}>Patient Reference</p>

              <div className="space-y-1 md:col-span-2">
                <label className={labelCls}>Patient ID <span className="text-red-500">*</span></label>
                <input id="enc-patientId" type="text" required value={f.patientId} onChange={set('patientId')} className={inputCls} placeholder="UUID of the patient" />
                <p className="text-xs text-[var(--sidebar-fg)]">Enter the patient's UUID (from Patients page)</p>
              </div>

              {/* ── Encounter Details ── */}
              <p className={sectionTitle}>Encounter Details</p>

              <div className="space-y-1">
                <label className={labelCls}>Status <span className="text-red-500">*</span></label>
                <select id="enc-status" value={f.status} onChange={set('status')} className={selectCls}>
                  {ENCOUNTER_STATUS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Encounter Class <span className="text-red-500">*</span></label>
                <select id="enc-class" value={f.encounterClass} onChange={set('encounterClass')} className={selectCls}>
                  {ENCOUNTER_CLASS.map(c => (
                    <option key={c.code} value={c.code}>{c.display}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Type Code (e.g. OPD, IPD)</label>
                <input id="enc-typeCode" type="text" value={f.typeCode} onChange={set('typeCode')} className={inputCls} placeholder="OPD" />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Type Display</label>
                <input id="enc-typeDisplay" type="text" value={f.typeDisplay} onChange={set('typeDisplay')} className={inputCls} placeholder="Outpatient Visit" />
              </div>

              {/* ── Period ── */}
              <p className={sectionTitle}>Period</p>

              <div className="space-y-1">
                <label className={labelCls}>Start Date &amp; Time</label>
                <input id="enc-periodStart" type="datetime-local" value={f.periodStart} onChange={set('periodStart')} className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>End Date &amp; Time</label>
                <input id="enc-periodEnd" type="datetime-local" value={f.periodEnd} onChange={set('periodEnd')} className={inputCls} />
              </div>

              {/* ── Clinical ── */}
              <p className={sectionTitle}>Clinical Info</p>

              <div className="space-y-1">
                <label className={labelCls}>Doctor / Participant</label>
                <input id="enc-doctor" type="text" value={f.doctorDisplay} onChange={set('doctorDisplay')} className={inputCls} placeholder="Dr. Smith" />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Ward / Location</label>
                <input id="enc-ward" type="text" value={f.ward} onChange={set('ward')} className={inputCls} placeholder="Ward 3A" />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className={labelCls}>Reason for Visit</label>
                <textarea id="enc-reason" rows={2} value={f.reasonText} onChange={set('reasonText')} className={`${inputCls} resize-none`} placeholder="Chief complaint or visit reason" />
              </div>

              {/* ── Hospitalization ── */}
              <p className={sectionTitle}>Hospitalization (optional)</p>

              <div className="space-y-1">
                <label className={labelCls}>Admit Source</label>
                <input id="enc-admitSource" type="text" value={f.admitSource} onChange={set('admitSource')} className={inputCls} placeholder="Emergency Room, GP Referral…" />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Discharge Disposition</label>
                <input id="enc-dischargeDispo" type="text" value={f.dischargeDisposition} onChange={set('dischargeDisposition')} className={inputCls} placeholder="Home, Transferred…" />
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-[var(--border)] px-6 py-4 flex-shrink-0">
            <button type="button" onClick={onClose} className="rounded-lg px-5 py-2.5 text-sm font-medium text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-active)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : encounterToEdit ? 'Save Changes' : 'Create Encounter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
