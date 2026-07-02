import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PolicyEditor } from '@/components/policies/policy-editor';

// Keep licensed sections as simple LockedFields so we don't pull in the heavy
// child editors; we're testing the wizard's conditional structure, not them.
vi.mock('@/hooks/use-features', () => ({ useFeatures: () => ({ isEnabled: () => false }) }));
vi.mock('@/lib/auth-store', () => ({ useAuthStore: { getState: () => ({ accessToken: null }) } }));

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline')))); // URL categories → fallback list
});

function renderEditor() {
  return render(<PolicyEditor policy={null} onClose={() => {}} onSave={() => {}} existingPolicies={[]} />);
}

describe('PolicyEditor — steering-driven slim wizard', () => {
  it('removes IAP and the source-address field entirely', () => {
    renderEditor();
    expect(screen.queryByText('Identity-Aware Proxy')).toBeNull();
    expect(screen.queryByText('Source Addresses')).toBeNull();
  });

  it('Internet steering shows Web Protection + Service, not DNS/private sections', () => {
    renderEditor();
    expect(screen.getByText('Web Protection')).toBeTruthy();
    expect(screen.getByText('Services')).toBeTruthy();
    expect(screen.queryByText('DNS Filtering')).toBeNull();
    expect(screen.queryByText('Private-Access Protection')).toBeNull();
  });

  it('DNS steering hides Service + access method and shows DNS Filtering', () => {
    renderEditor();
    fireEvent.click(screen.getByText('DNS'));
    expect(screen.getByText('DNS Filtering')).toBeTruthy();
    expect(screen.queryByText('Services')).toBeNull();
    expect(screen.queryByText('Access Method')).toBeNull();
    expect(screen.queryByText('Web Protection')).toBeNull();
  });

  it('Private Access shows WAF section + AI/ML anomaly detection', () => {
    renderEditor();
    fireEvent.click(screen.getByText('Private Access'));
    expect(screen.getByText('Private-Access Protection')).toBeTruthy();
    expect(screen.getByText('AI/ML anomaly detection')).toBeTruthy();
    expect(screen.queryByText('Web Protection')).toBeNull();
  });

  it('compliance gate blocks Save when an allow policy admits non-compliant devices', () => {
    renderEditor();
    // Default: allow + posture "Compliant only" ⇒ gate satisfied, Save enabled.
    expect(screen.getByText('Create Policy')).not.toBeDisabled();
    // Switch posture to "Any device" ⇒ gate blocks Save.
    fireEvent.click(screen.getByText('Any device'));
    const blocked = screen.getByText('Resolve compliance gate');
    expect(blocked).toBeDisabled();
    // Acknowledge the risk ⇒ Save re-enabled.
    fireEvent.click(screen.getByLabelText(/allow non-compliant devices/i));
    expect(screen.getByText('Create Policy')).not.toBeDisabled();
  });
});
