import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { api } from '../../lib/api';
import { PrivacyRequestForm } from './PrivacyRequestForm';

jest.mock('../../lib/api', () => ({
  api: { post: jest.fn() },
}));

describe('PrivacyRequestForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('submits a privacy request and explains identity verification', async () => {
    (api.post as jest.Mock).mockResolvedValue({ id: 'request-1', status: 'RECEIVED' });
    render(<PrivacyRequestForm />);

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'person@example.com' } });
    fireEvent.change(screen.getByLabelText('Request type'), { target: { value: 'DELETION' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit privacy request' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/privacy-requests', expect.objectContaining({
      email: 'person@example.com', requestType: 'DELETION',
    }), { skipAuth: true }));
    expect(await screen.findByRole('status')).toHaveTextContent('verify your identity');
  });

  it('shows submission failures accessibly', async () => {
    (api.post as jest.Mock).mockRejectedValue(new Error('Service unavailable'));
    render(<PrivacyRequestForm />);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'person@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit privacy request' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');
  });
});
