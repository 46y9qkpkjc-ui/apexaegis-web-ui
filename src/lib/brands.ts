import { create } from 'zustand';

// Per-user white-label skin. Overriding Tailwind's cyan-* / blue-* CSS variables
// re-skins the whole console. Logos are our own generic wordmarks (name + mark),
// not the providers' trademarked artwork. Colors approximate public palettes.
export interface Brand {
  id: string;
  name: string;
  initial: string;
  ramp: Record<string, string>; // 300..700
}

export const BRANDS: Record<string, Brand> = {
  apexaegis: { id: 'apexaegis', name: 'ApexAegis', initial: 'A',
    ramp: { '300': '#67e8f9', '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490' } },
  starhub: { id: 'starhub', name: 'StarHub', initial: 'S',
    ramp: { '300': '#a7e05a', '400': '#8dc63f', '500': '#72a52f', '600': '#5a8324', '700': '#456419' } },
  sptel: { id: 'sptel', name: 'SPtel', initial: 'SP',
    ramp: { '300': '#5eead4', '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e' } },
  singtel: { id: 'singtel', name: 'Singtel', initial: 'S',
    ramp: { '300': '#fca5a5', '400': '#f87171', '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c' } },
  m1: { id: 'm1', name: 'M1', initial: 'M1',
    ramp: { '300': '#fdba74', '400': '#fb923c', '500': '#f97316', '600': '#ea580c', '700': '#c2410c' } },
};

// Demo users -> brand skin (StarHub/SPtel prioritized).
export const USER_BRAND: Record<string, string> = {
  'demouser01@apexaegis.app': 'starhub',
  'demouser02@apexaegis.app': 'sptel',
  'demouser03@apexaegis.app': 'singtel',
  'demouser04@apexaegis.app': 'm1',
};

export function getBrand(id: string): Brand {
  return BRANDS[id] ?? BRANDS.apexaegis;
}

export function brandForEmail(email?: string): string {
  return (email && USER_BRAND[email.toLowerCase()]) || 'apexaegis';
}

export function applyBrand(id: string) {
  if (typeof document === 'undefined') return;
  const brand = getBrand(id);
  const root = document.documentElement;
  Object.entries(brand.ramp).forEach(([stop, hex]) => {
    root.style.setProperty(`--color-cyan-${stop}`, hex);
    root.style.setProperty(`--color-blue-${stop}`, hex);
  });
}

interface BrandState { brandId: string; setBrand: (id: string) => void; }
export const useBrand = create<BrandState>((set) => ({
  brandId: 'apexaegis',
  setBrand: (id) => { applyBrand(id); set({ brandId: id }); },
}));
