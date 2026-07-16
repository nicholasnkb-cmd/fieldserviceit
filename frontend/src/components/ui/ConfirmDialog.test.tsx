import { fireEvent, render, screen } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('describes the destructive action and requires an explicit confirmation', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        open
        title="Retire device?"
        description="The device can be restored later."
        confirmLabel="Retire device"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Retire device?');
    fireEvent.click(screen.getByRole('button', { name: 'Retire device' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancels with Escape', () => {
    const onCancel = jest.fn();
    render(<ConfirmDialog open title="Confirm" description="Details" onConfirm={jest.fn()} onCancel={onCancel} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
