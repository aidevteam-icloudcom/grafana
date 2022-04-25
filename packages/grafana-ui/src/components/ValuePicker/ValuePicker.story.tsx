import { Story } from '@storybook/react';
import React from 'react';

import { ValuePicker } from '@grafana/ui';

import { getAvailableIcons } from '../../types';
import { withCenteredStory } from '../../utils/storybook/withCenteredStory';
import { generateOptions } from '../Select/mockOptions';

import { ValuePickerProps } from './ValuePicker';
import mdx from './ValuePicker.mdx';

export default {
  title: 'Pickers and Editors/ValuePicker',
  component: ValuePicker,
  decorators: [withCenteredStory],
  parameters: {
    docs: {
      page: mdx,
    },
    controls: {
      exclude: ['onChange', 'options'],
    },
  },
  argTypes: {
    variant: {
      options: ['primary', 'secondary', 'destructive', 'link'],
      control: {
        type: 'select',
      },
    },
    icon: {
      control: {
        type: 'select',
        options: getAvailableIcons(),
      },
    },
    size: {
      options: ['sm', 'md', 'lg'],
      control: {
        type: 'select',
      },
    },
  },
};
const options = generateOptions();

export const Simple: Story<ValuePickerProps<string>> = (args) => {
  return (
    <div style={{ width: '200px' }}>
      <ValuePicker {...args} options={options} onChange={(v) => console.log(v)} />
    </div>
  );
};
Simple.args = {
  label: 'Pick an option',
  variant: 'primary',
  size: 'md',
  isFullWidth: false,
  icon: 'plus',
  menuPlacement: 'auto',
};
