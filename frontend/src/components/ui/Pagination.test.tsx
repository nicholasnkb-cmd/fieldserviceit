import { render, screen } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders page buttons', () => {
    render(<Pagination page={1} totalPages={5} onPage={jest.fn()} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it('disables Prev button on first page', () => {
    render(<Pagination page={1} totalPages={5} onPage={jest.fn()} />);
    expect(screen.getByText('Prev')).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    render(<Pagination page={5} totalPages={5} onPage={jest.fn()} />);
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('returns null when totalPages <= 1', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPage={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
