import { useCallback, useEffect, useState } from 'react';

export type AssistedPersonStatus = 'Ativa' | 'Inativa';

export interface AssistedPersonRecord {
  id: string;
  createdAt: string;
  fullName: string;
  cpf?: string;
  email: string;
  phone: string;
  neighborhood?: string;
  householdSize?: number;
  notes?: string;
  status: AssistedPersonStatus;
}

export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

const STORAGE_KEY = 'rsbp_assisted_people_v1';
const SYNC_EVENT = 'rsbp-assisted-people-sync';

function readAssistedPeople(): AssistedPersonRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AssistedPersonRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAssistedPeople(list: AssistedPersonRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch {
    // Ignore storage quota errors
  }
}

export function useAssistedPeopleStore() {
  const [assistedPeople, setAssistedPeople] = useState<AssistedPersonRecord[]>(() =>
    readAssistedPeople()
  );

  useEffect(() => {
    const refresh = () => setAssistedPeople(readAssistedPeople());
    window.addEventListener(SYNC_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(SYNC_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const addAssistedPerson = useCallback(
    (entry: Omit<AssistedPersonRecord, 'id' | 'createdAt' | 'status'>) => {
      const current = readAssistedPeople();
      const newPerson: AssistedPersonRecord = {
        ...entry,
        id: `assist-${Date.now()}`,
        createdAt: new Date().toLocaleDateString('pt-BR'),
        status: 'Ativa',
      };
      const next = [newPerson, ...current];
      setAssistedPeople(next);
      writeAssistedPeople(next);
      return newPerson;
    },
    []
  );

  const updateAssistedPersonStatus = useCallback(
    (id: string, status: AssistedPersonStatus) => {
      const current = readAssistedPeople();
      const next = current.map((p) => (p.id === id ? { ...p, status } : p));
      setAssistedPeople(next);
      writeAssistedPeople(next);
    },
    []
  );

  const deleteAssistedPerson = useCallback((id: string) => {
    const current = readAssistedPeople();
    const next = current.filter((p) => p.id !== id);
    setAssistedPeople(next);
    writeAssistedPeople(next);
  }, []);

  return {
    assistedPeople,
    addAssistedPerson,
    updateAssistedPersonStatus,
    deleteAssistedPerson,
  };
}
