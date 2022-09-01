import { Story, Meta } from '@storybook/react';
import React, { useState } from 'react';

import { KeyValue } from '@grafana/data';
import { Field, Icon, Button, Input } from '@grafana/ui';

import { getAvailableIcons, IconName, toIconName } from '../../types';
import { withCenteredStory } from '../../utils/storybook/withCenteredStory';

import mdx from './Input.mdx';
import { parseAccessory } from './storyUtils';

const prefixSuffixOpts = {
  None: null,
  Text: '$',
  ...getAvailableIcons().reduce<KeyValue<string>>((prev, c) => {
    return {
      ...prev,
      [`Icon: ${c}`]: `icon-${c}`,
    };
  }, {}),
};

const meta: Meta = {
  title: 'Forms/Input',
  component: Input,
  decorators: [withCenteredStory],
  parameters: {
    docs: {
      page: mdx,
    },
    controls: {
      exclude: ['prefix', 'suffix', 'addonBefore', 'addonAfter'],
    },
  },
  args: {
    type: 'text',
    width: 40,
    prefixVisible: '',
    suffixVisible: '',
    invalid: false,
    loading: false,
  },
  argTypes: {
    prefixVisible: {
      control: {
        type: 'select',
        options: prefixSuffixOpts,
      },
    },
    suffixVisible: {
      control: {
        type: 'select',
        options: prefixSuffixOpts,
      },
    },
    type: {
      control: {
        type: 'select',
        options: ['text', 'number', 'password'],
      },
    },
    // validation: { name: 'Validation regex (will do a partial match if you do not anchor it)' },
    width: { control: { type: 'range', min: 10, max: 200, step: 10 } },
  },
};

export const Simple: Story = (args) => {
  const addonAfter = <Button variant="secondary">Load</Button>;
  const addonBefore = <div style={{ display: 'flex', alignItems: 'center', padding: '5px' }}>Input</div>;
  const prefix = parseAccessory(args.prefixVisible);
  const suffix = parseAccessory(args.suffixVisible);

  return (
    <Input
      disabled={args.disabled}
      width={args.width}
      prefix={prefix}
      invalid={args.invalid}
      suffix={suffix}
      loading={args.loading}
      addonBefore={args.before && addonBefore}
      addonAfter={args.after && addonAfter}
      type={args.type}
      placeholder={args.placeholder}
    />
  );
};
Simple.args = {
  disabled: false,
  before: false,
  after: false,
  placeholder: 'Enter your name here...',
};

export const WithFieldValidation: Story = (args) => {
  const [value, setValue] = useState('');

  return (
    <div>
      <Field invalid={value === ''} error={value === '' ? 'This input is required' : ''}>
        <Input value={value} onChange={(e) => setValue(e.currentTarget.value)} {...args} />
      </Field>
    </div>
  );
};

export default meta;
