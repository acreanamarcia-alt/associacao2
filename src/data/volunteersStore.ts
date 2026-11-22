import { useCallback, useEffect, useState } from 'react';

export interface VolunteerApplication {
  id: string;
  roleId: string;
  roleTitle: string;
  fullName: string;
  cpf?: string;
  phone: string;
  email?: string;
  availability: string;
  notes: string;
  createdAt: string;
}

const STORAGE_KEY = 'rsbp_volunteer_applications_v1';
const SYNC_EVENT = 'rsbp-volunteers-sync';

export function readVolunteerApplications(): VolunteerApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VolunteerApplication[]) : [];
  } catch {
    return [];
  }
}

function writeVolunteerApplications(list: VolunteerApplication[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch {
    // Ignore storage quota errors
  }
}

export function useVolunteersStore() {
  const [applications, setApplications] = useState<VolunteerApplication[]>(() =>
    readVolunteerApplications()
  );

  useEffect(() => {
    const refresh = () => setApplications(readVolunteerApplications());
    window.addEventListener(SYNC_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(SYNC_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const addApplication = useCallback(
    (entry: Omit<VolunteerApplication, 'id' | 'createdAt'>) => {
      const current = readVolunteerApplications();
      const newApp: VolunteerApplication = {
        ...entry,
        id: `${entry.roleId}-${Date.now()}`,
        createdAt: new Date().toLocaleDateString('pt-BR'),
      };
      const next = [newApp, ...current];
      setApplications(next);
      writeVolunteerApplications(next);
      return newApp;
    },
    []
  );

  const removeApplication = useCallback((id: string) => {
    const current = readVolunteerApplications();
    const next = current.filter((item) => item.id !== id);
    setApplications(next);
    writeVolunteerApplications(next);
  }, []);

  return {
    applications,
    addApplication,
    removeApplication,
  };
}
