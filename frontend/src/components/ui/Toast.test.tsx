import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

function TestHarness({ type, message }: { type: 'success' | 'error' | 'info'; message: string }) {
  const { toast } = useToast();
  return <button onClick={() => toast(type, message)}>Show Toast</button>;
}

describe('Toast', () => {
  it('renders message after toast is triggered', () => {
    render(
      <ToastProvider>
        <TestHarness type="success" message="Hello" />
      </ToastProvider>
    );
    const btn = screen.getByText('Show Toast');
    act(() => btn.click());
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders with correct type class', () => {
    render(
      <ToastProvider>
        <TestHarness type="error" message="Error" />
      </ToastProvider>
    );
    act(() => screen.getByText('Show Toast').click());
    const toastEl = screen.getByText('Error').closest('div[class*="bg-"]');
    expect(toastEl).toHaveClass('bg-red-600');
  });

  it('deduplicates the same message from local and global error handlers', () => {
    render(
      <ToastProvider>
        <TestHarness type="error" message="Save failed" />
      </ToastProvider>
    );
    act(() => {
      screen.getByText('Show Toast').click();
      window.dispatchEvent(new CustomEvent('fieldserviceit:api-error', { detail: { message: 'Save failed' } }));
    });
    expect(screen.getAllByText('Save failed')).toHaveLength(1);
  });
});
