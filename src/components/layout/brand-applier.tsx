'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { brandForEmail, useBrand } from '@/lib/brands';

// Applies the white-label skin for the logged-in user (e.g. demouser01 -> StarHub).
export function BrandApplier() {
  const email = useAuthStore(s => s.user?.email);
  const setBrand = useBrand(s => s.setBrand);
  useEffect(() => {
    setBrand(brandForEmail(email));
  }, [email, setBrand]);
  return null;
}
