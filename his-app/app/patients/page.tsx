'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, UserCircle, Edit2, Trash2, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deletePatient, Patient } from '@/lib/api';
import PatientModal from '@/components/PatientModal';
import { useHIS } from '@/context/HISContext';

export default function PatientsPage() {
  const { patients, patientsLoading, fetchPatients, refreshPatients } = useHIS();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);

  // Debounced search via context fetch
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPatients(searchQuery || undefined);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, fetchPatients]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete patient ${name}?`)) return;
    try {
      await deletePatient(id);
      toast.success('Patient deleted successfully');
      refreshPatients();
    } catch {
      toast.error('Failed to delete patient');
    }
  };

  const handleEdit = (patient: Patient) => {
    setPatientToEdit(patient);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setPatientToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-full flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Patients</h1>
          <p className="mt-1 text-sm text-[var(--sidebar-fg)]">
            Manage your hospital's patient registry and FHIR resources.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all duration-200"
        >
          <Plus size={18} />
          Register Patient
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-sm overflow-hidden flex flex-col">

        {/* Search Bar */}
        <div className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between glass">
          <div className="relative w-full max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-lg border border-[var(--border)] bg-transparent py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Search by name or identifier..."
            />
          </div>
        </div>

        {/* Patient Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {patientsLoading ? (
            <div className="flex h-full items-center justify-center text-[var(--sidebar-fg)]">
              Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-full bg-[var(--sidebar-active)] p-6 mb-4 text-[var(--sidebar-fg)]">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)]">No patients found</h3>
              <p className="text-sm text-[var(--sidebar-fg)] mt-1">Get started by registering a new patient.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => {
                const name = patient.name?.[0];
                const given = name?.given?.join(' ') || '';
                const family = name?.family || '';
                const fullName = `${given} ${family}`.trim() || 'Unknown Name';
                const identifier = patient.identifier?.[0]?.value || 'No ID';

                return (
                  <div
                    key={patient.id}
                    className="group relative flex flex-col rounded-xl border border-[var(--border)] bg-transparent p-5 hover:border-primary/50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sidebar-active)] text-primary">
                          <UserCircle size={28} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base text-[var(--foreground)] truncate max-w-[150px]">{fullName}</h3>
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30">
                            {identifier}
                          </span>
                        </div>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(patient)}
                          className="p-1.5 text-gray-400 hover:text-primary rounded-md hover:bg-[var(--sidebar-active)] transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id as string, fullName)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-y-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-[var(--sidebar-fg)] uppercase tracking-wider">Gender</span>
                        <span className="text-[var(--foreground)] capitalize mt-0.5">{patient.gender || '-'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-[var(--sidebar-fg)] uppercase tracking-wider">DOB</span>
                        <span className="text-[var(--foreground)] mt-0.5">{patient.birthDate || '-'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <PatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patientToEdit={patientToEdit}
        onSuccess={refreshPatients}
      />
    </div>
  );
}
