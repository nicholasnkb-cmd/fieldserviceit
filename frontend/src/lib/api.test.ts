import { unwrapResponseBody } from './api';

describe('unwrapResponseBody', () => {
  it('preserves paginated list metadata from the backend envelope', () => {
    const body = {
      success: true,
      data: [{ id: 'ticket-1' }],
      meta: { page: 1, total: 1, totalPages: 1 },
      timestamp: '2026-06-01T00:00:00.000Z',
    };

    expect(unwrapResponseBody(body)).toEqual({
      data: [{ id: 'ticket-1' }],
      meta: { page: 1, total: 1, totalPages: 1 },
    });
  });

  it('returns non-paginated envelope data unchanged', () => {
    const body = {
      success: true,
      data: { id: 'user-1' },
      timestamp: '2026-06-01T00:00:00.000Z',
    };

    expect(unwrapResponseBody(body)).toEqual({ id: 'user-1' });
  });
});
