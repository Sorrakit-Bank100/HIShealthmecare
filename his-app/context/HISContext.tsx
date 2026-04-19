'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import {
  Patient,  getPatients,
  Encounter, getEncounters,
  Observation, getObservations,
} from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HISContextType {
  // ── Patients ──
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  patientsLoading: boolean;
  patientsError: string | null;
  fetchPatients: (name?: string, identifier?: string, gender?: string) => Promise<void>;
  refreshPatients: () => Promise<void>;

  // ── Encounters ──
  encounters: Encounter[];
  setEncounters: React.Dispatch<React.SetStateAction<Encounter[]>>;
  encountersLoading: boolean;
  encountersError: string | null;
  fetchEncounters: (patient?: string, status?: string) => Promise<void>;
  refreshEncounters: () => Promise<void>;

  // ── Observations ──
  observations: Observation[];
  setObservations: React.Dispatch<React.SetStateAction<Observation[]>>;
  observationsLoading: boolean;
  observationsError: string | null;
  fetchObservations: (patient?: string, encounter?: string, code?: string) => Promise<void>;
  refreshObservations: () => Promise<void>;

  // ── Summary counts (useful for the dashboard) ──
  counts: { patients: number; encounters: number; observations: number };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const HISContext = createContext<HISContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function HISProvider({ children }: { children: ReactNode }) {
  // ── Patients ──
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [lastPatientParams, setLastPatientParams] = useState<[string?, string?, string?]>([]);

  const fetchPatients = useCallback(async (name?: string, identifier?: string, gender?: string) => {
    setPatientsLoading(true);
    setPatientsError(null);
    setLastPatientParams([name, identifier, gender]);
    try {
      const data = await getPatients(name, identifier, gender);
      setPatients(data.entry?.map(e => e.resource) ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load patients';
      setPatientsError(msg);
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  const refreshPatients = useCallback(
    () => fetchPatients(...lastPatientParams),
    [fetchPatients, lastPatientParams]
  );

  // ── Encounters ──
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [encountersLoading, setEncountersLoading] = useState(false);
  const [encountersError, setEncountersError] = useState<string | null>(null);
  const [lastEncounterParams, setLastEncounterParams] = useState<[string?, string?]>([]);

  const fetchEncounters = useCallback(async (patient?: string, status?: string) => {
    setEncountersLoading(true);
    setEncountersError(null);
    setLastEncounterParams([patient, status]);
    try {
      const data = await getEncounters(patient, status);
      setEncounters(data.entry?.map(e => e.resource) ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load encounters';
      setEncountersError(msg);
    } finally {
      setEncountersLoading(false);
    }
  }, []);

  const refreshEncounters = useCallback(
    () => fetchEncounters(...lastEncounterParams),
    [fetchEncounters, lastEncounterParams]
  );

  // ── Observations ──
  const [observations, setObservations] = useState<Observation[]>([]);
  const [observationsLoading, setObservationsLoading] = useState(false);
  const [observationsError, setObservationsError] = useState<string | null>(null);
  const [lastObsParams, setLastObsParams] = useState<[string?, string?, string?]>([]);

  const fetchObservations = useCallback(async (patient?: string, encounter?: string, code?: string) => {
    setObservationsLoading(true);
    setObservationsError(null);
    setLastObsParams([patient, encounter, code]);
    try {
      const data = await getObservations(patient, encounter, code);
      setObservations(data.entry?.map(e => e.resource) ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load observations';
      setObservationsError(msg);
    } finally {
      setObservationsLoading(false);
    }
  }, []);

  const refreshObservations = useCallback(
    () => fetchObservations(...lastObsParams),
    [fetchObservations, lastObsParams]
  );

  // ── Initial load on mount ──
  useEffect(() => {
    fetchPatients();
    fetchEncounters();
    fetchObservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = {
    patients: patients.length,
    encounters: encounters.length,
    observations: observations.length,
  };

  return (
    <HISContext.Provider
      value={{
        patients, setPatients,
        patientsLoading, patientsError,
        fetchPatients, refreshPatients,

        encounters, setEncounters,
        encountersLoading, encountersError,
        fetchEncounters, refreshEncounters,

        observations, setObservations,
        observationsLoading, observationsError,
        fetchObservations, refreshObservations,

        counts,
      }}
    >
      {children}
    </HISContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHIS(): HISContextType {
  const ctx = useContext(HISContext);
  if (!ctx) {
    throw new Error('useHIS must be used inside <HISProvider>');
  }
  return ctx;
}
