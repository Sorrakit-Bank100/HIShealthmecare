'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Patient, createPatient, updatePatient } from '@/lib/api';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientToEdit?: Patient | null;
  onSuccess: () => void;
}

const FHIR_EXT_BASE = 'https://his.hospital.th/fhir/StructureDefinition';

const MARITAL_STATUS_OPTIONS = [
  { code: 'S', display: 'Single' },
  { code: 'M', display: 'Married' },
  { code: 'D', display: 'Divorced' },
  { code: 'W', display: 'Widowed' },
  { code: 'UNK', display: 'Unknown' },
];

const BLOOD_GROUP_OPTIONS = ['A', 'B', 'AB', 'O'];
const BLOOD_RH_OPTIONS = ['+', '-'];

function getExtVal(ext: Patient['extension'], urlKey: string): string {
  const found = ext?.find((e) => e.url.toLowerCase().includes(urlKey));
  return found?.valueString ?? found?.valueCode ?? '';
}

const emptyForm = {
  // Identifiers
  hn: '',
  cid: '',
  pid: '',
  hid: '',
  // Name
  prename: '',
  given: '',
  family: '',
  // Core
  gender: 'unknown',
  birthDate: '',
  phone: '',
  // Address
  address: '',
  city: '',
  postalCode: '',
  country: 'TH',
  // Clinical / Social
  maritalStatus: '',
  occupation: '',
  bloodGroup: '',
  bloodGroupRh: '',
  nation: '',
  race: '',
  religion: '',
  education: '',
};

export default function PatientModal({ isOpen, onClose, patientToEdit, onSuccess }: PatientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (patientToEdit) {
      const ext = patientToEdit.extension ?? [];
      const identifiers = patientToEdit.identifier ?? [];

      const getIdent = (systemKey: string) =>
        identifiers.find((i) => i.system?.toLowerCase().includes(systemKey))?.value ?? '';

      setFormData({
        hn: getIdent('hn') || identifiers[0]?.value || '',
        cid: getIdent('cid') || getIdent('citizen') || getIdent('national'),
        pid: getIdent('pid') || getIdent('patient'),
        hid: getIdent('hid') || getIdent('house'),
        prename: patientToEdit.name?.[0]?.prefix?.join(' ') ?? '',
        given: patientToEdit.name?.[0]?.given?.join(' ') ?? '',
        family: patientToEdit.name?.[0]?.family ?? '',
        gender: patientToEdit.gender ?? 'unknown',
        birthDate: patientToEdit.birthDate ?? '',
        phone: patientToEdit.telecom?.find((t) => t.system === 'phone')?.value ?? patientToEdit.telecom?.[0]?.value ?? '',
        address: patientToEdit.address?.[0]?.line?.[0] ?? '',
        city: patientToEdit.address?.[0]?.city ?? '',
        postalCode: patientToEdit.address?.[0]?.postalCode ?? '',
        country: patientToEdit.address?.[0]?.country ?? 'TH',
        maritalStatus: patientToEdit.maritalStatus?.text ?? patientToEdit.maritalStatus?.coding?.[0]?.code ?? '',
        occupation: getExtVal(ext, 'occupation'),
        bloodGroup: getExtVal(ext, 'blood-group') || getExtVal(ext, 'bloodgroup'),
        bloodGroupRh: getExtVal(ext, 'blood-group-rh') || getExtVal(ext, 'rh'),
        nation: getExtVal(ext, 'nation') || getExtVal(ext, 'nationality'),
        race: getExtVal(ext, 'race'),
        religion: getExtVal(ext, 'religion'),
        education: getExtVal(ext, 'education'),
      });
    } else {
      setFormData(emptyForm);
    }
  }, [patientToEdit, isOpen]);

  if (!isOpen) return null;

  const f = formData;
  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const identifiers: Patient['identifier'] = [];
      if (f.hn) identifiers.push({ use: 'official', system: `${FHIR_EXT_BASE}/hn`, value: f.hn });
      if (f.cid) identifiers.push({ use: 'secondary', system: `${FHIR_EXT_BASE}/cid`, value: f.cid });
      if (f.pid) identifiers.push({ use: 'secondary', system: `${FHIR_EXT_BASE}/pid`, value: f.pid });
      if (f.hid) identifiers.push({ use: 'secondary', system: `${FHIR_EXT_BASE}/hid`, value: f.hid });

      const extensions: Patient['extension'] = [];
      if (f.nation) extensions.push({ url: `${FHIR_EXT_BASE}/nationality`, valueString: f.nation });
      if (f.race) extensions.push({ url: `${FHIR_EXT_BASE}/race`, valueString: f.race });
      if (f.religion) extensions.push({ url: `${FHIR_EXT_BASE}/religion`, valueString: f.religion });
      if (f.education) extensions.push({ url: `${FHIR_EXT_BASE}/education`, valueString: f.education });
      if (f.occupation) extensions.push({ url: `${FHIR_EXT_BASE}/occupation`, valueString: f.occupation });
      if (f.bloodGroup) extensions.push({ url: `${FHIR_EXT_BASE}/blood-group`, valueCode: f.bloodGroup });
      if (f.bloodGroupRh) extensions.push({ url: `${FHIR_EXT_BASE}/blood-group-rh`, valueCode: f.bloodGroupRh });

      const maritalMatch = MARITAL_STATUS_OPTIONS.find((o) => o.code === f.maritalStatus || o.display === f.maritalStatus);

      const payload: Patient = {
        resourceType: 'Patient',
        active: true,
        identifier: identifiers.length ? identifiers : undefined,
        name: [{
          use: 'official',
          prefix: f.prename ? [f.prename] : undefined,
          family: f.family,
          given: f.given ? [f.given] : undefined,
        }],
        gender: f.gender,
        birthDate: f.birthDate || undefined,
        telecom: f.phone ? [{ system: 'phone', value: f.phone, use: 'mobile' }] : undefined,
        address: f.address || f.city ? [{
          use: 'home',
          line: f.address ? [f.address] : undefined,
          city: f.city || undefined,
          postalCode: f.postalCode || undefined,
          country: f.country || undefined,
        }] : undefined,
        maritalStatus: maritalMatch ? {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus', code: maritalMatch.code, display: maritalMatch.display }],
          text: maritalMatch.display,
        } : undefined,
        extension: extensions.length ? extensions : undefined,
      };

      if (patientToEdit?.id) {
        await updatePatient(patientToEdit.id, payload);
        toast.success('Patient updated successfully');
      } else {
        await createPatient(payload);
        toast.success('Patient registered successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save patient';
      console.error('[PatientModal]', error);
      toast.error(msg, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-[var(--foreground)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
  const selectCls = `${inputCls} appearance-none`;
  const labelCls = 'text-sm font-medium text-[var(--foreground)]';
  const sectionTitle = 'text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-fg)] col-span-full mt-2 pb-1 border-b border-[var(--border)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-[var(--card-bg)] shadow-xl border border-[var(--border)] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 flex-shrink-0">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {patientToEdit ? 'Edit Patient' : 'Register New Patient'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-5">
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">

              {/* ── Identifiers ── */}
              <p className={sectionTitle}>Identifiers</p>

              <div className="space-y-1">
                <label className={labelCls}>Hospital Number (HN) <span className="text-red-500">*</span></label>
                <input id="field-hn" type="text" required value={f.hn} onChange={set('hn')} className={inputCls} placeholder="HN-2024-001" />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Citizen ID (CID)</label>
                <input id="field-cid" type="text" value={f.cid} onChange={set('cid')} className={inputCls} placeholder="1234567890123" maxLength={13} />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Patient ID (PID)</label>
                <input id="field-pid" type="text" value={f.pid} onChange={set('pid')} className={inputCls} placeholder="PID-00456" />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Household ID (HID)</label>
                <input id="field-hid" type="text" value={f.hid} onChange={set('hid')} className={inputCls} placeholder="HID-789" />
              </div>

              {/* ── Name ── */}
              <p className={sectionTitle}>Name</p>

              <div className="space-y-1">
                <label className={labelCls}>Prefix / Title</label>
                <input id="field-prename" type="text" value={f.prename} onChange={set('prename')} className={inputCls} placeholder="นาย / Miss / Mr." />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Given Name <span className="text-red-500">*</span></label>
                <input id="field-given" type="text" required value={f.given} onChange={set('given')} className={inputCls} placeholder="First name" />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Family Name <span className="text-red-500">*</span></label>
                <input id="field-family" type="text" required value={f.family} onChange={set('family')} className={inputCls} placeholder="Last name" />
              </div>

              {/* ── Demographics ── */}
              <p className={sectionTitle}>Demographics</p>

              <div className="space-y-1">
                <label className={labelCls}>Gender</label>
                <select id="field-gender" value={f.gender} onChange={set('gender')} className={selectCls}>
                  <option value="unknown">Unknown</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Birth Date <span className="text-red-500">*</span></label>
                <input id="field-birthDate" type="date" required value={f.birthDate} onChange={set('birthDate')} className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Marital Status</label>
                <select id="field-maritalStatus" value={f.maritalStatus} onChange={set('maritalStatus')} className={selectCls}>
                  <option value="">— Select —</option>
                  {MARITAL_STATUS_OPTIONS.map((o) => (
                    <option key={o.code} value={o.code}>{o.display}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Phone Number</label>
                <input id="field-phone" type="tel" value={f.phone} onChange={set('phone')} className={inputCls} placeholder="0812345678" />
              </div>

              {/* ── Address ── */}
              <p className={sectionTitle}>Address</p>

              <div className="space-y-1 md:col-span-2">
                <label className={labelCls}>Address Line</label>
                <input id="field-address" type="text" value={f.address} onChange={set('address')} className={inputCls} placeholder="123 ถนนพหลโยธิน" />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>City</label>
                <input id="field-city" type="text" value={f.city} onChange={set('city')} className={inputCls} placeholder="กรุงเทพมหานคร" />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Postal Code</label>
                <input id="field-postalCode" type="text" value={f.postalCode} onChange={set('postalCode')} className={inputCls} placeholder="10900" />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Country</label>
                <input id="field-country" type="text" value={f.country} onChange={set('country')} className={inputCls} placeholder="TH" />
              </div>

              {/* ── Social / Clinical ── */}
              <p className={sectionTitle}>Social & Clinical</p>

              <div className="space-y-1">
                <label className={labelCls}>Nationality</label>
                <input id="field-nation" type="text" value={f.nation} onChange={set('nation')} className={inputCls} placeholder="Thai" />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Race</label>
                <input id="field-race" type="text" value={f.race} onChange={set('race')} className={inputCls} placeholder="Thai" />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Religion</label>
                <input id="field-religion" type="text" value={f.religion} onChange={set('religion')} className={inputCls} placeholder="Buddhism" />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Education</label>
                <input id="field-education" type="text" value={f.education} onChange={set('education')} className={inputCls} placeholder="Bachelor's Degree" />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Occupation</label>
                <input id="field-occupation" type="text" value={f.occupation} onChange={set('occupation')} className={inputCls} placeholder="Software Engineer" />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Blood Group</label>
                <select id="field-bloodGroup" value={f.bloodGroup} onChange={set('bloodGroup')} className={selectCls}>
                  <option value="">— Select —</option>
                  {BLOOD_GROUP_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Rh Factor</label>
                <select id="field-bloodGroupRh" value={f.bloodGroupRh} onChange={set('bloodGroupRh')} className={selectCls}>
                  <option value="">— Select —</option>
                  {BLOOD_RH_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-[var(--border)] px-6 py-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-active)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : patientToEdit ? 'Save Changes' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
