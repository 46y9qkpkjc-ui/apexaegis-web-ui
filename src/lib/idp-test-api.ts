// IdP Test Connection API Client

export interface TestConnectionResponse {
  success: boolean;
  provider_type: string;
  provider_name: string;
  test_result: string; // success, failed_auth, failed_network, timeout
  duration_ms: number;
  error_message?: string;
  diagnostics?: Record<string, any>;
}

export interface TestConnectionError {
  error: string;
  request_id?: string;
}

/**
 * Test connection to an IdP configuration
 * @param idpId - The IdP configuration ID
 * @param testType - Type of test: "full" or "quick" (defaults to "full")
 * @returns TestConnectionResponse on success
 */
export async function testIdPConnection(
  idpId: string,
  testType: string = 'full'
): Promise<TestConnectionResponse> {
  const response = await fetch(`/api/v1/admin/idp/${idpId}/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ test_type: testType }),
  });

  if (!response.ok) {
    const error: TestConnectionError = await response.json().catch(() => ({
      error: `HTTP ${response.status}`,
    }));
    throw new Error(error.error || 'Test connection failed');
  }

  return await response.json();
}

/**
 * Format diagnostic info for display
 */
export function formatDiagnostics(
  diagnostics?: Record<string, any>
): string[] {
  if (!diagnostics) return [];

  const lines: string[] = [];
  for (const [key, value] of Object.entries(diagnostics)) {
    const formattedKey = key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    if (Array.isArray(value)) {
      lines.push(`${formattedKey}: ${value.join(', ')}`);
    } else if (typeof value === 'object') {
      lines.push(`${formattedKey}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`${formattedKey}: ${value}`);
    }
  }
  return lines;
}

/**
 * Get human-readable message for test result
 */
export function getTestResultMessage(
  result: TestConnectionResponse
): string {
  if (result.success) {
    return `✅ Connection successful (${result.duration_ms}ms)`;
  }

  const resultMessages: Record<string, string> = {
    failed_auth: '❌ Authentication failed - check credentials',
    failed_network: '❌ Network error - endpoint unreachable',
    timeout: '⏱️ Connection timeout - endpoint took too long to respond',
    failed: '❌ Connection test failed',
  };

  return resultMessages[result.test_result] || '❌ Connection test failed';
}
