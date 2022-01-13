import React from 'react';
import NamedColorsGroup from './NamedColorsGroup';
import { ColorSwatch } from './ColorSwatch';
import { useStyles2, useTheme2 } from '../../themes/ThemeContext';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export interface NamedColorsPaletteProps {
  color?: string;
  onChange: (colorName: string) => void;
}

export const NamedColorsPalette = ({ color, onChange }: NamedColorsPaletteProps) => {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);

  const swatches: JSX.Element[] = [];
  for (const hue of theme.visualization.hues) {
    swatches.push(<NamedColorsGroup key={hue.name} selectedColor={color} hue={hue} onColorSelect={onChange} />);
  }

  return (
    <>
      <div className={styles.swatches}>{swatches}</div>
      <div className={styles.extraColors}>
        <ColorSwatch
          isSelected={color === 'transparent'}
          color={'rgba(0,0,0,0)'}
          label="Transparent"
          onClick={() => onChange('transparent')}
        />
        <ColorSwatch
          isSelected={color === 'text'}
          color={theme.colors.text.primary}
          label="Text color"
          onClick={() => onChange('text')}
        />
      </div>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: flex;
      flex-direction: column;
    `,
    extraColors: css`
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(1, 0)};
    `,
    swatches: css`
      display: grid;
      flex-grow: 1;
    `,
  };
};
