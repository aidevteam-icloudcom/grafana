import React, { FC, useState } from 'react';
import { useTheme, VizLegend } from '@grafana/ui';
import { Story, Meta } from '@storybook/react';
import {} from './VizLegendListItem';
import { DisplayValue, getColorForTheme, GrafanaTheme } from '@grafana/data';
import { withCenteredStory } from '../../utils/storybook/withCenteredStory';
import { VizLegendItem } from './types';
import { LegendDisplayMode, LegendPlacement } from './models.gen';

export default {
  title: 'Visualizations/VizLegend',
  component: VizLegend,
  decorators: [withCenteredStory],
  parameters: {
    knobs: {
      disable: true,
    },
    controls: {
      exclude: ['seriesCount'],
    },
  },
  args: {
    containerWidth: '100%',
  },
  argTypes: {
    containerWidth: {
      control: {
        type: 'select',
        options: ['200px', '500px', '100%'],
      },
    },
  },
} as Meta;

interface LegendStoryDemoProps {
  name: string;
  displayMode: LegendDisplayMode;
  placement: LegendPlacement;
  seriesCount: number;
  stats?: DisplayValue[];
}

const LegendStoryDemo: FC<LegendStoryDemoProps> = ({ displayMode, seriesCount, name, placement, stats }) => {
  const theme = useTheme();
  const [items, setItems] = useState<VizLegendItem[]>(generateLegendItems(seriesCount, theme, stats));

  const onSeriesColorChange = (label: string, color: string) => {
    setItems(
      items.map((item) => {
        if (item.label === label) {
          return {
            ...item,
            color: color,
          };
        }

        return item;
      })
    );
  };

  const onLabelClick = (clickItem: VizLegendItem) => {
    setItems(
      items.map((item) => {
        if (item !== clickItem) {
          return {
            ...item,
            disabled: true,
          };
        } else {
          return {
            ...item,
            disabled: false,
          };
        }
      })
    );
  };

  return (
    <p style={{ marginBottom: '32px' }}>
      <h3 style={{ marginBottom: '32px' }}>{name}</h3>
      <VizLegend
        displayMode={displayMode}
        items={items}
        placement={placement}
        onSeriesColorChange={onSeriesColorChange}
        onLabelClick={onLabelClick}
      />
    </p>
  );
};

const seriesCount = 5;
export const Basic: Story = (args) => {
  return (
    <div style={{ width: args.containerWidth }}>
      <LegendStoryDemo
        name="List mode, placement bottom"
        displayMode={LegendDisplayMode.List}
        seriesCount={seriesCount}
        placement="bottom"
      />
      <LegendStoryDemo
        name="List mode, placement right"
        displayMode={LegendDisplayMode.List}
        seriesCount={seriesCount}
        placement="right"
      />
      <LegendStoryDemo
        name="Table mode"
        displayMode={LegendDisplayMode.Table}
        seriesCount={seriesCount}
        placement="bottom"
      />
    </div>
  );
};

function generateLegendItems(
  numberOfSeries: number,
  theme: GrafanaTheme,
  statsToDisplay?: DisplayValue[]
): VizLegendItem[] {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const colors = ['green', 'blue', 'red', 'purple', 'orange', 'dark-green', 'yellow', 'light-blue'].map((c) =>
    getColorForTheme(c, theme)
  );

  return [...new Array(numberOfSeries)].map((item, i) => {
    return {
      label: `${alphabet[i].toUpperCase()}-series`,
      color: colors[i],
      yAxis: 1,
      displayValues: statsToDisplay || [],
    };
  });
}
