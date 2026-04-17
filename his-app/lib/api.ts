// his-app/lib/api.ts
const API_BASE_URL = 'http://localhost:8000/fhir';

export interface Patient {
  id?: string;
  resourceType: 'Patient';
  active?: boolean;
  name?: Array<{
    use?: string;
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
}

export interface PatientSearchResult {
  resourceType: 'Bundle';
  type: 'searchset';
  total: number;
  entry?: Array<{
    fullUrl: string;
    resource: Patient;
  }>;
}

export const getPatients = async (
  name?: string,
  identifier?: string,
  gender?: string
): Promise<PatientSearchResult> => {
  const query = new URLSearchParams();
  if (name) query.append('name', name);
  if (identifier) query.append('identifier', identifier);
  if (gender) query.append('gender', gender);

  const res = await fetch(`${API_BASE_URL}/Patient?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch patients');
  }
  return res.json();
};

export const getPatient = async (id: string): Promise<Patient> => {
  const res = await fetch(`${API_BASE_URL}/Patient/${id}`);
  if (!res.ok) {
    throw new Error('Failed to fetch patient');
  }
  return res.json();
};

export const createPatient = async (patient: Patient): Promise<Patient> => {
  const res = await fetch(`${API_BASE_URL}/Patient`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patient),
  });
  if (!res.ok) {
    throw new Error('Failed to create patient');
  }
  return res.json();
};

export const updatePatient = async (id: string, patient: Patient): Promise<Patient> => {
  const res = await fetch(`${API_BASE_URL}/Patient/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patient),
  });
  if (!res.ok) {
    throw new Error('Failed to update patient');
  }
  return res.json();
};

export const deletePatient = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/Patient/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete patient');
  }
};
