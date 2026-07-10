'use client';
// Self-contained guided product tour: an edge-docked launcher chip + a stepped,
// spotlighted tooltip card (Skip / Back / Next, "Step X of N"). Brand-aware via
// the --color-cyan-* CSS vars the skin overrides, so the accent matches the
// active partner. No external dependency. Reused verbatim in the storefront.
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

export interface TourStep {
  target?: string;                       // CSS selector; omit for a centered card
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface Props {
  steps: TourStep[];
  storageKey: string;   // localStorage key so a completed tour doesn't auto-open
  label?: string;       // launcher chip label
  autoStart?: boolean;  // open on first visit
}

const ACCENT = 'var(--color-cyan-500, #06b6d4)';

export function GuidedTour({ steps, storageKey, label = 'Guide', autoStart = true }: Props) {
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const step = steps[idx];

  // Auto-open once per browser (until completed/skipped).
  useEffect(() => {
    if (autoStart && !localStorage.getItem(storageKey)) {
      const t = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(t);
    }
  }, [autoStart, storageKey]);

  const locate = useCallback(() => {
    if (!step?.target) { setRect(null); return; }
    const el = document.querySelector(step.target);
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setRect(el.getBoundingClientRect());
  }, [step]);

  useLayoutEffect(() => {
    if (!active) return;
    locate();
    const on = () => locate();
    window.addEventListener('resize', on);
    window.addEventListener('scroll', on, true);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('scroll', on, true); };
  }, [active, idx, locate]);

  const finish = useCallback(() => {
    localStorage.setItem(storageKey, 'done');
    setActive(false); setIdx(0); setRect(null);
  }, [storageKey]);

  const start = () => { setIdx(0); setActive(true); };
  const next = () => (idx < steps.length - 1 ? setIdx(idx + 1) : finish());
  const back = () => setIdx(Math.max(0, idx - 1));

  if (!steps.length) return null;

  // ── Launcher chip (edge-docked, like the reference) ──
  if (!active) {
    return (
      <button
        onClick={start}
        aria-label="Open product tour"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[60] flex items-center gap-2 pl-3 pr-2 py-2.5 rounded-l-xl text-white text-xs font-semibold shadow-2xl hover:pr-3 transition-all"
        style={{ backgroundColor: ACCENT }}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
        </svg>
        {label}
      </button>
    );
  }

  // ── Positioning of the tooltip card ──
  const CARD_W = 320, GAP = 12, PAD = 12;
  let cardStyle: React.CSSProperties;
  if (!rect) {
    cardStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  } else {
    const place = step.placement ?? (rect.bottom + 180 < window.innerHeight ? 'bottom' : 'top');
    const left = Math.min(Math.max(PAD, rect.left), window.innerWidth - CARD_W - PAD);
    if (place === 'top') cardStyle = { top: rect.top - GAP, left, transform: 'translateY(-100%)' };
    else if (place === 'left') cardStyle = { top: rect.top, left: rect.left - CARD_W - GAP };
    else if (place === 'right') cardStyle = { top: rect.top, left: rect.right + GAP };
    else cardStyle = { top: rect.bottom + GAP, left };
  }

  return (
    <>
      {/* Backdrop + spotlight (box-shadow hole around the target) */}
      <div className="fixed inset-0 z-[60]" onClick={finish} aria-hidden>
        {rect && (
          <div
            className="absolute rounded-lg transition-all"
            style={{
              top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12,
              boxShadow: '0 0 0 9999px rgba(2,6,23,0.72)', outline: `2px solid ${ACCENT}`,
            }}
          />
        )}
        {!rect && <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.72)' }} />}
      </div>

      {/* Tooltip card */}
      <div
        className="fixed z-[61] rounded-2xl border border-gray-700 bg-gray-900 text-gray-100 shadow-2xl p-4"
        style={{ width: CARD_W, maxWidth: 'calc(100vw - 24px)', ...cardStyle }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-bold leading-snug">{step.title}</h4>
          <button onClick={finish} className="text-[11px] text-gray-400 hover:text-gray-200 shrink-0 mt-0.5">Skip tour</button>
        </div>
        <p className="text-[13px] text-gray-300 mt-2 leading-relaxed">{step.body}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-[11px] text-gray-500">Step {idx + 1} of {steps.length}</span>
          <div className="flex items-center gap-2">
            {idx > 0 && (
              <button onClick={back} className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800">Back</button>
            )}
            <button onClick={next} className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold inline-flex items-center gap-1" style={{ backgroundColor: ACCENT }}>
              {idx === 0 ? 'Start' : idx === steps.length - 1 ? 'Done' : 'Next'}
              {idx !== steps.length - 1 && <span aria-hidden>›</span>}
            </button>
          </div>
        </div>
        {/* progress bar */}
        <div className="mt-3 h-1 rounded-full bg-gray-800 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${((idx + 1) / steps.length) * 100}%`, backgroundColor: ACCENT }} />
        </div>
      </div>
    </>
  );
}
