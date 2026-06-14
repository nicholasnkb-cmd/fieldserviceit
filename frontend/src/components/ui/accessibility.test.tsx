import { act, render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Alert } from './Alert';
import { ToastProvider, useToast } from './Toast';
import { PermissionHistoryPanel } from '../admin/PermissionHistoryPanel';

function ToastHarness() {
  const { toast } = useToast();
  return <button onClick={() => toast('error', 'Unable to save settings')}>Show error</button>;
}

describe('shared UI accessibility', () => {
  it('renders alerts without automated accessibility violations', async () => {
    const { container } = render(<Alert type="warning" message="Maintenance begins tonight" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders actionable error toasts without automated accessibility violations', async () => {
    const { container, getByRole } = render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );
    act(() => getByRole('button', { name: 'Show error' }).click());
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders permission rollback history without automated accessibility violations', async () => {
    const { container } = render(
      <PermissionHistoryPanel
        history={[{
          id: 'history-1',
          roleId: 'role-1',
          action: 'ROLE_PERMISSIONS_UPDATED',
          createdAt: '2026-06-13T12:00:00.000Z',
          actor: { firstName: 'Tenant', lastName: 'Admin', email: 'admin@example.com' },
          diff: { roleName: 'Dispatcher', before: ['tickets.view'], added: ['tickets.edit'], removed: [] },
        }]}
        roleNames={{ 'role-1': 'Dispatcher' }}
        onRestore={jest.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
