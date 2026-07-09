import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../app/(public)/login/page';

const push = jest.fn();
let returnTo: string | null = null;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});
const setUser = jest.fn();
jest.mock('../stores/authStore', () => ({ useAuthStore: () => ({ company: null, setUser }) }));

describe('LoginPage', () => {
  beforeEach(() => {
    push.mockClear();
    setUser.mockClear();
    returnTo = null;
    window.history.pushState({}, '', '/login');
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/v1/auth/login')) {
        return {
          ok: true,
          json: async () => ({
            user: { id: 'user-1', email: 'nick@example.com', firstName: 'Nick', lastName: 'B' },
            accessToken: 'access',
            refreshToken: 'refresh',
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => [],
      } as Response;
    });
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

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

  it('honors a safe returnTo path after login', async () => {
    returnTo = '/dashboard';
    window.history.pushState({}, '', `/login?returnTo=${encodeURIComponent(returnTo)}`);

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'nick@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret-password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(setUser).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }));
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('falls back to dashboard for unsafe returnTo values', async () => {
    returnTo = '//evil.example';
    window.history.pushState({}, '', `/login?returnTo=${encodeURIComponent(returnTo)}`);

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'nick@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret-password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(push).toHaveBeenCalledWith('/dashboard');
  });
});
