import { create } from 'zustand';

// Bridges the header (top menu) action buttons to the always-mounted overlay
// components that live in separate React subtrees: the GuidedTour (mounted in
// layout-shell) and the AiCommandCenter (mounted in the root layout). The header
// sits in a different subtree from both, so a tiny shared store is the cleanest
// bridge — mirrors the useTenantContext pattern.
interface UiPanelsState {
  // ── AI assistant panel ──
  aiOpen: boolean;
  setAiOpen: (open: boolean) => void;
  toggleAi: () => void;

  // ── Guided tour ──
  // A monotonically-increasing counter. Each increment signals the mounted
  // GuidedTour to (re)start from step 0. A counter — not a boolean — lets the
  // tour be re-launched even after it has already been completed once (the
  // storageKey guard only governs the first-visit auto-open, not manual replays).
  tourStartCount: number;
  startTour: () => void;
}

export const useUiPanels = create<UiPanelsState>((set) => ({
  aiOpen: false,
  setAiOpen: (open) => set({ aiOpen: open }),
  toggleAi: () => set((s) => ({ aiOpen: !s.aiOpen })),

  tourStartCount: 0,
  startTour: () => set((s) => ({ tourStartCount: s.tourStartCount + 1 })),
}));
