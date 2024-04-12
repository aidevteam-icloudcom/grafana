import React from 'react';

import { Button } from '@grafana/ui';

interface RemoveButtonProps {
  remove: (index?: number | number[] | undefined) => void;
  index: number;
}
export function RemoveButton({ remove, index }: RemoveButtonProps) {
  return (
    <Button
      aria-label="delete label"
      icon="trash-alt"
      data-testid={`delete-label-${index}`}
      variant="secondary"
      onClick={() => {
        remove(index);
      }}
    />
  );
}

interface AddButtonProps {
  append: () => void;
}
export function AddButton({ append }: AddButtonProps) {
  return (
    <Button icon="plus" type="button" variant="secondary" onClick={append}>
      Add more
    </Button>
  );
}
