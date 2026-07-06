import { create } from 'zustand';

// Per-user white-label skin. Overriding Tailwind's cyan-* / blue-* CSS variables
// re-skins the whole console. Logos are our own generic wordmarks (name + mark),
// not the providers' trademarked artwork. Colors approximate public palettes.
export interface Brand {
  id: string;
  name: string;
  initial: string;
  ramp: Record<string, string>; // 50/100/300..700
  logoSvg?: string;             // optional provider logo (supplied asset)
}

// StarHub logo (supplied by the customer).
const STARHUB_LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130.9 176.53"><path fill="#1ed760" d="M130.51,59a8.15,8.15,0,0,0-4.65-4.61,29.6,29.6,0,0,0-6.47-1.8,108.88,108.88,0,0,0-16.34-1.09c-5.92,0-15.42.46-22,.84l3-43L39,0l4.62,59.45a99.18,99.18,0,0,1,10.57-1.63S60.38,27.71,67.48,25.6c5.79-1.74,12.41,25.59,13.4,29.79l.13.52s43.48-3.69,46.12,4.2c3.13,9.37-35.6,22.77-35.6,22.77s24.72,67.94,16.34,71.87C103.14,157,86,131.92,76.55,117.47c-3.7-5.76-6.24-9.85-6.24-9.85-5.41,6.3-13,14.28-21.25,22.32l3.6,46.59L73.79,158l2.35-34.6c2.32,3.47,4.91,7.29,7.55,11a184.09,184.09,0,0,0,12.88,16.7,41.59,41.59,0,0,0,5.68,5.42,10.67,10.67,0,0,0,3,1.59,5.6,5.6,0,0,0,4.18-.12c3.16-1.47,3.65-5.17,3.78-7.24a46.34,46.34,0,0,0-.8-9.48,217.69,217.69,0,0,0-6.11-24.92C102.5,103.48,98.2,90.89,96.14,85c3.69-1.42,9.87-3.86,15.94-6.79a69.47,69.47,0,0,0,13.07-7.82c3-2.42,7-6.54,5.38-11.44"/><path fill="#1ed760" d="M2.53,75.46c-.56,8.88,38.85,9.49,43,9,0,0-50.69,72.78-45.1,81.21,3.32,5,27.94-15.54,48.63-35.74L43.65,59.45c-16.16,3.14-40.71,10.13-41.12,16"/></svg>';

export const BRANDS: Record<string, Brand> = {
  apexaegis: { id: 'apexaegis', name: 'ApexAegis', initial: 'A',
    ramp: { '300': '#67e8f9', '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490' } },
  starhub: { id: 'starhub', name: 'StarHub', initial: 'S', logoSvg: STARHUB_LOGO,
    ramp: { '50': '#e5f9f7', '100': '#c9f3e0', '300': '#6ee89a', '400': '#3ddf76', '500': '#1ed760', '600': '#17b34e', '700': '#0f8a3c' } },
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
