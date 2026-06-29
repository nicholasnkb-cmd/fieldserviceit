import { render, screen } from '@testing-library/react';
import { RequireCompanyContext } from '../components/layout/RequireCompanyContext';
import { TenantContextBanner } from '../components/layout/TenantContextBanner';

let authState: any;

jest.mock('next/link', () => {
  return function MockLink({ children, href }: any) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../stores/authStore', () => ({
  useAuthStore: () => authState,
}));

describe('tenant context checks', () => {
  it('blocks tenant pages for global super admin context', () => {
    authState = { user: { role: 'SUPER_ADMIN' }, activeCompanyContext: null };

    render(
      <RequireCompanyContext area="Network monitoring">
        <div>Network data</div>
      </RequireCompanyContext>,
    );

    expect(screen.getByText(/select a business first/i)).toBeInTheDocument();
    expect(screen.queryByText('Network data')).not.toBeInTheDocument();
  });

  it('shows the super admin company banner when scoped to a company', () => {
    authState = { user: { role: 'SUPER_ADMIN' }, activeCompanyContext: { id: 'company-1', name: 'Acme IT' } };

    render(<TenantContextBanner />);

    expect(screen.getByText(/super admin view/i)).toBeInTheDocument();
    expect(screen.getByText(/Acme IT/i)).toBeInTheDocument();
  });
});
