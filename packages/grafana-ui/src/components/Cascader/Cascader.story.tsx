// import { boolean, text, select, number } from '@storybook/addon-knobs';
import { withCenteredStory } from '../../utils/storybook/withCenteredStory';
import { Cascader } from './Cascader';
// import { Button } from '../Button';
import mdx from './Cascader.mdx';
import React from 'react';

export default {
  title: 'UI/Cascader',
  component: Cascader,
  decorators: [withCenteredStory],
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

const options = [
  {
    label: 'First',
    value: '1',
    children: [
      {
        label: 'Second',
        value: '2',
      },
      {
        label: 'Third',
        value: '3',
      },
      {
        label: 'Fourth',
        value: '4',
      },
    ],
  },
  {
    label: 'FirstFirst',
    value: '5',
  },
];

export const simple = () => <Cascader options={options} onSelect={val => console.log(val)} />;
export const withSearch = () => <Cascader options={options} search={true} onSelect={val => console.log(val)} />;
