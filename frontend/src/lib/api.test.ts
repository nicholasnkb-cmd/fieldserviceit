import { getListData, getResponseMeta, unwrapResponseBody } from './api';

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

  it('extracts list data from raw arrays and paginated objects', () => {
    expect(getListData([{ id: 'a' }])).toEqual([{ id: 'a' }]);
    expect(getListData({ data: [{ id: 'b' }], meta: { total: 1 } })).toEqual([{ id: 'b' }]);
    expect(getListData({ value: [] })).toEqual([]);
  });

  it('extracts response metadata only from object responses', () => {
    expect(getResponseMeta({ data: [], meta: { total: 2 } })).toEqual({ total: 2 });
    expect(getResponseMeta([])).toBeUndefined();
  });
});
