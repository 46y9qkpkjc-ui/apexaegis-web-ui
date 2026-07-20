'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { brandForUser, useBrand } from '@/lib/brands';

// Applies the white-label skin for the logged-in user: an MSP operator is skinned
// to their operator (April -> StarHub), a consumer to their tenant (Samuel -> Aspire).
export function BrandApplier() {
  const email = useAuthStore(s => s.user?.email);
  const operatorScope = useAuthStore(s => s.user?.operator_scope);
  const setBrand = useBrand(s => s.setBrand);
  useEffect(() => {
    setBrand(brandForUser({ email, operator_scope: operatorScope }));
  }, [email, operatorScope, setBrand]);
  return null;
}
