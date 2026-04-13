import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { getMyPet } from '../api/pets';
import { getProfiles } from '../api/profiles';

interface OnboardingContextType {
  hasPet: boolean;
  testComplete: boolean;
  onboarded: boolean;
  loading: boolean;
  setPetCreated: () => void;
  setTestCompleted: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hasPet, setHasPet] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  // Derived loading: true when user exists but we haven't verified this user yet.
  // This is synchronous — no stale state between render and useEffect.
  const loading = user ? checkedUserId !== user.id : false;

  useEffect(() => {
    if (!user) {
      setHasPet(false);
      setTestComplete(false);
      setCheckedUserId(null);
      return;
    }

    let cancelled = false;

    Promise.all([
      getMyPet().then(() => true).catch(() => false),
      getProfiles().then(profiles => profiles.length >= 6).catch(() => false),
    ]).then(([pet, test]) => {
      if (cancelled) return;
      setHasPet(pet);
      setTestComplete(test);
      setCheckedUserId(user.id);
    });

    return () => { cancelled = true; };
  }, [user]);

  const onboarded = hasPet && testComplete;

  return (
    <OnboardingContext.Provider value={{
      hasPet,
      testComplete,
      onboarded,
      loading,
      setPetCreated: () => setHasPet(true),
      setTestCompleted: () => setTestComplete(true),
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
