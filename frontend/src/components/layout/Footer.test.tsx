import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it.each([false, true])('renders every navigation group and copyright when compact=%s', (compact) => {
    render(<Footer compact={compact} />);
    expect(screen.getByRole('navigation', { name: 'Footer navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'MSP Ticketing' })).toHaveAttribute('href', '/msp-ticketing-software');
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Track a Ticket' })).toHaveAttribute('href', '/track');
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms');
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} FieldserviceIT`))).toBeInTheDocument();
  });
});
