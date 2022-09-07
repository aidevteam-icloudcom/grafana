import { ComponentMeta } from '@storybook/react';
import React, { useState } from 'react';

import { withCenteredStory } from '../../../utils/storybook/withCenteredStory';
import { Button } from '../../Button/Button';

import { DatePicker, DatePickerProps } from './DatePicker';
import mdx from './DatePicker.mdx';

const meta: ComponentMeta<typeof DatePicker> = {
  title: 'Pickers and Editors/TimePickers/Pickers And Editors/DatePicker',
  component: DatePicker,
  decorators: [withCenteredStory],
  argTypes: {
    minDate: { control: 'date' },
  },
  parameters: {
    docs: {
      page: mdx,
    },
    controls: {
      exclude: ['onChange', 'onClose', 'value', 'isOpen'],
    },
  },
};

export const Basic = (args: DatePickerProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);

  if (args?.minDate !== undefined) {
    args.minDate = new Date(args.minDate);
  }

  args = {
    ...args,
    isOpen: open,
    value: date,
    onChange: (newDate) => setDate(newDate),
    onClose: () => setOpen(false),
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Show Calendar</Button>
      <DatePicker {...args} />
    </>
  );
};

export default meta;
