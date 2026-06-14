import { render, waitFor } from '@testing-library/react';
import { TenantTheme } from './TenantTheme';
import { useAuthStore } from '../../stores/authStore';

describe('TenantTheme', () => {
  afterEach(() => {
    useAuthStore.setState({ company: null });
    document.documentElement.removeAttribute('style');
    delete document.documentElement.dataset.tenantTheme;
  });

  it('applies semantic theme variables with readable primary contrast', async () => {
    useAuthStore.setState({
      company: {
        id: 'company-1',
        name: 'Acme',
        branding: {
          primaryColor: '#fef08a',
          secondaryColor: '#e2e8f0',
          accentColor: '#0ea5e9',
          backgroundColor: '#f8fafc',
          surfaceColor: '#ffffff',
          textColor: '#0f172a',
          borderRadius: 12,
        },
      },
    });

    render(<TenantTheme />);

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--primary')).not.toBe('');
      expect(document.documentElement.style.getPropertyValue('--primary-foreground')).toBe('222.2 84% 4.9%');
      expect(document.documentElement.style.getPropertyValue('--radius')).toBe('12px');
    });
  });
});
