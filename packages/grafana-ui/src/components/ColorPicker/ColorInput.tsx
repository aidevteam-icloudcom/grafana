import { cx, css } from '@emotion/css';
import { debounce } from 'lodash';
import React, { forwardRef, useState, useEffect, useMemo } from 'react';
import tinycolor from 'tinycolor2';

import { GrafanaTheme2 } from '@grafana/data';

import { useStyles2 } from '../../themes';
import { Input, Props as InputProps } from '../Input/Input';

import { ColorPickerProps } from './ColorPickerPopover';

interface ColorInputProps extends ColorPickerProps, Omit<InputProps, 'color' | 'onChange'> {
  isClearable?: boolean;
}

const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  ({ color, onChange, isClearable = false, ...inputProps }, ref) => {
    const [value, setValue] = useState(color);
    const [previousColor, setPreviousColor] = useState(color);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const updateColor = useMemo(() => debounce(onChange, 100), []);

    useEffect(() => {
      const newColor = tinycolor(color);
      if (newColor.isValid() && color !== previousColor) {
        setValue(newColor.toString());
        setPreviousColor(color);
      }
    }, [color, previousColor]);

    const onChangeColor = (event: React.SyntheticEvent<HTMLInputElement>) => {
      const { value: colorValue } = event.currentTarget;

      setValue(colorValue);
      if (colorValue === '' && isClearable) {
        updateColor(colorValue);
        return;
      }
      const newColor = tinycolor(colorValue);

      if (newColor.isValid()) {
        updateColor(newColor.toString());
      }
    };

    const onBlur = () => {
      const newColor = tinycolor(value);

      if (!newColor.isValid()) {
        setValue(color);
      }
    };

    return (
      <Input
        {...inputProps}
        value={value}
        onChange={onChangeColor}
        onBlur={onBlur}
        addonBefore={<ColorPreview color={color} />}
        ref={ref}
      />
    );
  }
);

ColorInput.displayName = 'ColorInput';

export default ColorInput;

interface ColorPreviewProps {
  color: string;
}

const ColorPreview = ({ color }: ColorPreviewProps) => {
  const styles = useStyles2(getColorPreviewStyles);

  return (
    <div
      className={cx(
        styles,
        css`
          background-color: ${color};
        `
      )}
    />
  );
};

const getColorPreviewStyles = (theme: GrafanaTheme2) => css`
  height: 100%;
  width: ${theme.spacing.gridSize * 4}px;
  border-radius: ${theme.shape.borderRadius()} 0 0 ${theme.shape.borderRadius()};
  border: 1px solid ${theme.colors.border.medium};
`;
