import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TenantCustomizationEditor } from './TenantCustomizationEditor';

jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn().mockResolvedValue([]),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    upload: jest.fn(),
  },
}));

describe('TenantCustomizationEditor', () => {
  it('blocks publishing and explains invalid color values in place', async () => {
    const user = userEvent.setup();
    render(
      <TenantCustomizationEditor
        initial={{ id: 'company-1', name: 'Acme', branding: {}, settings: {} }}
        onMessage={jest.fn()}
      />,
    );

    const primaryTextInput = screen.getAllByDisplayValue('#2563eb')
      .find((element) => element.getAttribute('type') !== 'color')!;
    await user.clear(primaryTextInput);
    await user.type(primaryTextInput, 'blue');

    expect(screen.getByText('Primary must be a six-digit hex color.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish changes' })).toBeDisabled();
    expect(primaryTextInput).toHaveAttribute('aria-invalid', 'true');
  });
});
