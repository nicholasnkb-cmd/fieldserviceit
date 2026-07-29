import { render, screen, waitFor } from '@testing-library/react';
import TechnicianMobilePage from './page';
import { api } from '../../../lib/api';

jest.mock('lucide-react', () => {
  const Icon = () => <span aria-hidden="true" />;
  return new Proxy({}, { get: () => Icon });
});

jest.mock('../../../lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
  getListData: (response: unknown) => Array.isArray(response) ? response : [],
}));

describe('TechnicianMobilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('keeps assigned jobs usable when optional summary and inventory requests fail', async () => {
    (api.get as jest.Mock).mockImplementation((endpoint: string) => {
      if (endpoint === '/dispatch') {
        return Promise.resolve([{
          id: 'dispatch-1',
          status: 'DISPATCHED',
          createdAt: '2026-07-29T12:00:00.000Z',
          ticket: {
            id: 'ticket-1',
            ticketNumber: 'T-100',
            title: 'Repair the mobile router',
            priority: 'HIGH',
            status: 'ASSIGNED',
          },
        }]);
      }
      return Promise.reject(new Error('Feature unavailable'));
    });

    render(<TechnicianMobilePage />);

    expect(await screen.findAllByText('Repair the mobile router')).not.toHaveLength(0);
    expect(screen.getAllByText('T-100')).not.toHaveLength(0);
    expect(screen.queryByText('Failed to load mobile workflow')).not.toBeInTheDocument();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));
  });
});
