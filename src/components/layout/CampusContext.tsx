'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Campus } from '@/types';

interface CampusContextType {
  selectedCampusId: number;
  setSelectedCampusId: (id: number) => void;
  campuses: Campus[];
  loading: boolean;
}

const CampusContext = createContext<CampusContextType>({
  selectedCampusId: 1,
  setSelectedCampusId: () => {},
  campuses: [],
  loading: true,
});

export function CampusProvider({ children }: { children: ReactNode }) {
  const [selectedCampusId, setSelectedCampusId] = useState<number>(1);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampuses() {
      try {
        const res = await fetch('/api/campuses');
        if (res.ok) {
          const data = await res.json();
          setCampuses(data);
          if (data.length > 0 && !data.find((c: Campus) => c.id === selectedCampusId)) {
            setSelectedCampusId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch campuses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCampuses();
  }, []);

  return (
    <CampusContext.Provider value={{ selectedCampusId, setSelectedCampusId, campuses, loading }}>
      {children}
    </CampusContext.Provider>
  );
}

export function useCampus() {
  const context = useContext(CampusContext);
  if (!context) {
    throw new Error('useCampus must be used within a CampusProvider');
  }
  return context;
}

export default CampusContext;
