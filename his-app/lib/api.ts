// his-app/lib/api.ts
const API_BASE_URL = 'http://localhost:8000/fhir';

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface Patient {
  id?: string;
  resourceType: 'Patient';
  active?: boolean;
  name?: Array<{
    use?: string;
    prefix?: string[];
    family?: string;
    given?: string[];
  }>;
  gender?: string;
  birthDate?: string;
  identifier?: Array<{
    use?: string;
    system?: string;
    value?: string;
  }>;
  telecom?: Array<{
    system?: string;
    value?: string;
    use?: string;
  }>;
  address?: Array<{
    use?: string;
    line?: string[];
    city?: string;
    postalCode?: string;
    country?: string;
  }>;
  maritalStatus?: {
    coding?: Array<{ system?: string; code?: string; display?: string }>;
    text?: string;
  };
  extension?: Array<{
    url: string;
    valueString?: string;
    valueCode?: string;
    valueCodeableConcept?: {
      coding?: Array<{ system?: string; code?: string; display?: string }>;
      text?: string;
    };
  }>;
}

export interface PatientSearchResult {
  resourceType: 'Bundle';
  type: 'searchset';
  total: number;
  entry?: Array<{ fullUrl: string; resource: Patient }>;
}

export const getPatients = async (name?: string, identifier?: string, gender?: string): Promise<PatientSearchResult> => {
  const query = new URLSearchParams();
  if (name) query.append('name', name);
  if (identifier) query.append('identifier', identifier);
  if (gender) query.append('gender', gender);
  const res = await fetch(`${API_BASE_URL}/Patient?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch patients');
  return res.json();
};

export const getPatient = async (id: string): Promise<Patient> => {
  const res = await fetch(`${API_BASE_URL}/Patient/${id}`);
  if (!res.ok) throw new Error('Failed to fetch patient');
  return res.json();
};

export const createPatient = async (patient: Patient): Promise<Patient> => {
  const res = await fetch(`${API_BASE_URL}/Patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patient),
  });
  if (!res.ok) throw new Error('Failed to create patient');
  return res.json();
};

export const updatePatient = async (id: string, patient: Patient): Promise<Patient> => {
  const res = await fetch(`${API_BASE_URL}/Patient/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patient),
  });
  if (!res.ok) throw new Error('Failed to update patient');
  return res.json();
};

export const deletePatient = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/Patient/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete patient');
};

// ─── Encounter ────────────────────────────────────────────────────────────────

export interface Encounter {
  id?: string;
  resourceType: 'Encounter';
  status: string;
  class: { system?: string; code: string; display?: string };
  subject?: { reference: string; display?: string };
  type?: Array<{
    coding?: Array<{ system?: string; code?: string; display?: string }>;
    text?: string;
  }>;
  period?: { start?: string; end?: string };
  participant?: Array<{
    individual?: { reference?: string; display?: string };
  }>;
  reasonCode?: Array<{
    coding?: Array<{ system?: string; code?: string; display?: string }>;
    text?: string;
  }>;
  hospitalization?: {
    admitSource?: { coding?: Array<{ system?: string; code?: string; display?: string }>; text?: string };
    dischargeDisposition?: { coding?: Array<{ system?: string; code?: string; display?: string }>; text?: string };
  };
  location?: Array<{ location?: { reference?: string; display?: string } }>;
}

export interface EncounterSearchResult {
  resourceType: 'Bundle';
  type: 'searchset';
  total: number;
  entry?: Array<{ fullUrl: string; resource: Encounter }>;
}

export const getEncounters = async (patient?: string, status?: string): Promise<EncounterSearchResult> => {
  const query = new URLSearchParams();
  if (patient) query.append('patient', patient);
  if (status) query.append('status', status);
  const res = await fetch(`${API_BASE_URL}/Encounter?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch encounters');
  return res.json();
};

export const getEncounter = async (id: string): Promise<Encounter> => {
  const res = await fetch(`${API_BASE_URL}/Encounter/${id}`);
  if (!res.ok) throw new Error('Failed to fetch encounter');
  return res.json();
};

export const createEncounter = async (encounter: Encounter): Promise<Encounter> => {
  const res = await fetch(`${API_BASE_URL}/Encounter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(encounter),
  });
  if (!res.ok) throw new Error('Failed to create encounter');
  return res.json();
};

export const updateEncounter = async (id: string, encounter: Encounter): Promise<Encounter> => {
  const res = await fetch(`${API_BASE_URL}/Encounter/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(encounter),
  });
  if (!res.ok) throw new Error('Failed to update encounter');
  return res.json();
};

export const deleteEncounter = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/Encounter/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete encounter');
};

// ─── Observation ──────────────────────────────────────────────────────────────

export interface Observation {
  id?: string;
  resourceType: 'Observation';
  status: string;
  code: {
    coding?: Array<{ system?: string; code?: string; display?: string }>;
    text?: string;
  };
  subject?: { reference: string; display?: string };
  encounter?: { reference: string; display?: string };
  effectiveDateTime?: string;
  valueQuantity?: { value?: number; unit?: string; system?: string; code?: string };
  valueString?: string;
  valueCodeableConcept?: {
    coding?: Array<{ system?: string; code?: string; display?: string }>;
    text?: string;
  };
  component?: Array<{
    code: { coding?: Array<{ system?: string; code?: string; display?: string }>; text?: string };
    valueQuantity?: { value?: number; unit?: string; system?: string; code?: string };
    valueString?: string;
  }>;
  category?: Array<{ coding?: Array<{ system?: string; code?: string; display?: string }> }>;
  note?: Array<{ text: string }>;
}

export interface ObservationSearchResult {
  resourceType: 'Bundle';
  type: 'searchset';
  total: number;
  entry?: Array<{ fullUrl: string; resource: Observation }>;
}

export const getObservations = async (patient?: string, encounter?: string, code?: string): Promise<ObservationSearchResult> => {
  const query = new URLSearchParams();
  if (patient) query.append('patient', patient);
  if (encounter) query.append('encounter', encounter);
  if (code) query.append('code', code);
  const res = await fetch(`${API_BASE_URL}/Observation?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch observations');
  return res.json();
};

export const getObservation = async (id: string): Promise<Observation> => {
  const res = await fetch(`${API_BASE_URL}/Observation/${id}`);
  if (!res.ok) throw new Error('Failed to fetch observation');
  return res.json();
};

export const createObservation = async (obs: Observation): Promise<Observation> => {
  const res = await fetch(`${API_BASE_URL}/Observation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obs),
  });
  if (!res.ok) throw new Error('Failed to create observation');
  return res.json();
};

export const updateObservation = async (id: string, obs: Observation): Promise<Observation> => {
  const res = await fetch(`${API_BASE_URL}/Observation/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obs),
  });
  if (!res.ok) throw new Error('Failed to update observation');
  return res.json();
};

export const deleteObservation = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/Observation/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete observation');
};
