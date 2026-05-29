import { render, screen } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders message text', () => {
    render(<Alert type="error" message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders with correct variant color', () => {
    const { container } = render(<Alert type="success" message="Success!" />);
    expect(container.firstChild).toHaveClass('bg-emerald-50');
  });

  it('does not render dismiss button by default', () => {
    render(<Alert type="info" message="Info" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders dismiss button when onDismiss provided', () => {
    const onDismiss = jest.fn();
    render(<Alert type="warning" message="Warning" onDismiss={onDismiss} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
    btn.click();
    expect(onDismiss).toHaveBeenCalled();
  });
});
