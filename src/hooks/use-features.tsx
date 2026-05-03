'use client';
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { fetchFeatures, type Feature } from '@/lib/feature-api';

interface FeatureContextValue {
  features: Feature[];
  isEnabled: (featureId: string) => boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextValue>({
  features: [],
  isEnabled: () => true,
  loading: true,
  refresh: async () => {},
});

export function FeatureProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const feats = await fetchFeatures();
      setFeatures(feats);
    } catch {
      // Backend unreachable — treat all features as enabled (demo mode)
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const isEnabled = useCallback((featureId: string) => {
    // If no features loaded (backend down), default to enabled
    if (features.length === 0) return true;
    const f = features.find(feat => feat.id === featureId);
    if (!f) return true; // Unknown feature — allow by default
    if (!f.enabled) return false;
    // Check trial expiry
    if (f.trial_end) {
      return new Date(f.trial_end) > new Date();
    }
    return true;
  }, [features]);

  return (
    <FeatureContext.Provider value={{ features, isEnabled, loading, refresh: load }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeatures() {
  return useContext(FeatureContext);
}
