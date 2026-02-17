import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';

describe('apiClient FormData handling', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sends FormData body without forcing JSON content-type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const form = new FormData();
    form.append('file', new Blob(['hello'], { type: 'text/plain' }), 'test.txt');
    form.append('order_index', '1');

    await apiClient.post('/api/v1/admin/lessons/test/assets', form);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = (init.headers ?? {}) as Record<string, string>;

    expect(url).toContain('/api/v1/admin/lessons/test/assets');
    expect(init.body).toBe(form);
    expect(headers['Content-Type']).toBeUndefined();
    expect(headers.Accept).toBe('application/json');
  });
});
