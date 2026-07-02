import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScannedDoc } from '../types';

const STORAGE_KEY = 'lens_docs';

export function useScannedDocs() {
  const [docs, setDocs] = useState<ScannedDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setDocs(JSON.parse(raw));
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = async (updated: ScannedDoc[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setDocs(updated);
  };

  const saveDoc = useCallback(
    async (doc: ScannedDoc) => {
      const existing = docs.find((item) => item.id === doc.id);
      const mergedDoc = existing ? { ...existing, ...doc } : doc;
      const updated = [mergedDoc, ...docs.filter((item) => item.id !== doc.id)];
      await persist(updated);
      return mergedDoc;
    },
    [docs]
  );

  const deleteDoc = useCallback(
    async (id: string) => {
      const updated = docs.filter((d) => d.id !== id);
      await persist(updated);
    },
    [docs]
  );

  const renameDoc = useCallback(
    async (id: string, name: string) => {
      const updated = docs.map((d) => (d.id === id ? { ...d, name } : d));
      await persist(updated);
    },
    [docs]
  );

  return { docs, loading, saveDoc, deleteDoc, renameDoc };
}
