import { render, screen } from '@testing-library/react';
import LoginPage from '../app/(public)/login/page';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});
jest.mock('../stores/authStore', () => ({ useAuthStore: () => ({ setUser: jest.fn() }) }));

describe('LoginPage', () => {
  it('renders the sign-in form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /fieldserviceit/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders links for register, forgot password, ticket tracking', () => {
    render(<LoginPage />);
    expect(screen.getByText(/create a public account/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByText(/track a ticket/i)).toBeInTheDocument();
  });
});
