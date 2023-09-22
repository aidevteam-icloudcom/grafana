import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import { Grid } from './Grid';
import mdx from './Grid.mdx';

const meta: Meta<typeof Grid> = {
  title: 'General/Layout/Grid',
  component: Grid,
  parameters: {
    docs: {
      page: mdx,
    },
  },
  args: {
    gap: 1,
  },
};

export const ColumnsNumber: StoryFn<typeof Grid> = (args) => {
  return (
    <Grid gap={args.gap} columns={args.columns}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{ background: 'gray', textAlign: 'center' }}>
          {' '}
          n #{i}
        </div>
      ))}
    </Grid>
  );
};
ColumnsNumber.args = {
  columns: 3,
};
ColumnsNumber.parameters = {
  controls: {
    exclude: ['minColumnWidth'],
  },
};

export const ColumnsMinWidth: StoryFn<typeof Grid> = (args) => {
  return (
    <Grid gap={args.gap} minColumnWidth={args.minColumnWidth}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{ background: 'gray' }}>
          {' '}
          n #{i}
        </div>
      ))}
    </Grid>
  );
};
ColumnsMinWidth.args = {
  minColumnWidth: 44,
};
ColumnsMinWidth.parameters = {
  controls: {
    exclude: ['columns'],
  },
};

export default meta;
