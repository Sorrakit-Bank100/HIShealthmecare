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

export default function PatientModal({ isOpen, onClose, patientToEdit, onSuccess }: PatientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    family: '',
    given: '',
    gender: 'unknown',
    birthDate: '',
    phone: '',
    address: '',
    city: '',
  });

  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        identifier: patientToEdit.identifier?.[0]?.value || '',
        family: patientToEdit.name?.[0]?.family || '',
        given: patientToEdit.name?.[0]?.given?.[0] || '',
        gender: patientToEdit.gender || 'unknown',
        birthDate: patientToEdit.birthDate || '',
        phone: patientToEdit.telecom?.[0]?.value || '',
        address: patientToEdit.address?.[0]?.line?.[0] || '',
        city: patientToEdit.address?.[0]?.city || '',
      });
    } else {
      setFormData({
        identifier: '',
        family: '',
        given: '',
        gender: 'unknown',
        birthDate: '',
        phone: '',
        address: '',
        city: '',
      });
    }
  }, [patientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: Patient = {
        resourceType: 'Patient',
        active: true,
        identifier: formData.identifier ? [{ use: 'official', value: formData.identifier }] : undefined,
        name: [{ use: 'official', family: formData.family, given: [formData.given] }],
        gender: formData.gender,
        birthDate: formData.birthDate || undefined,
        telecom: formData.phone ? [{ system: 'phone', value: formData.phone, use: 'mobile' }] : undefined,
        address: formData.address || formData.city ? [{
          use: 'home',
          line: formData.address ? [formData.address] : undefined,
          city: formData.city || undefined,
        }] : undefined,
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
      console.error(error);
      toast.error('Failed to save patient. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-[var(--card-bg)] shadow-xl border border-[var(--border)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
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

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Patient Identifier (HN)</label>
              <input
                type="text"
                required
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-[var(--foreground)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="HN-2024-001"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Given Name (First Name)</label>
              <input
                type="text"
                required
                value={formData.given}
                onChange={(e) => setFormData({ ...formData, given: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-[var(--foreground)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Family Name (Last Name)</label>
              <input
                type="text"
                required
                value={formData.family}
                onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-[var(--foreground)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-[var(--foreground)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
              >
                <option value="unknown">Unknown</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Birth Date</label>
              <input
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-[var(--foreground)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-[var(--foreground)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0812345678"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Address Line</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-[var(--foreground)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-[var(--foreground)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-[var(--border)] pt-6">
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
