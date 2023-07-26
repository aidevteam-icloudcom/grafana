import { css } from '@emotion/css';
import React, { createElement, CSSProperties, useCallback } from 'react';
import ReactDomServer from 'react-dom/server';

import { GrafanaTheme2, ThemeTypographyVariantTypes } from '@grafana/data';

import { useStyles2 } from '../../themes';
import { Tooltip } from '../Tooltip/Tooltip';

import { customWeight, customColor, customVariant } from './utils';

export interface TextProps {
  /** Defines what HTML element is defined underneath. "span" by default */
  element?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'p';
  /** What typograpy variant should be used for the component. Only use if default variant for the defined element is not what is needed */
  variant?: keyof ThemeTypographyVariantTypes;
  /** Override the default weight for the used variant */
  weight?: 'light' | 'regular' | 'medium' | 'bold';
  /** Color to use for text */
  color?: keyof GrafanaTheme2['colors']['text'] | 'error' | 'success' | 'warning' | 'info';
  /** Use to cut the text off with ellipsis if there isn't space to show all of it. On hover shows the rest of the text */
  truncate?: boolean;
  /** If true, show the text as italic. False by default */
  italic?: boolean;
  /** Whether to align the text to left, center or right */
  textAlignment?: CSSProperties['textAlign'];
  children: NonNullable<React.ReactNode>;
}

export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ element = 'span', variant, weight, color, truncate, italic, textAlignment, children }, ref) => {
    const styles = useStyles2(
      useCallback(
        (theme) => getTextStyles(theme, element, variant, color, weight, truncate, italic, textAlignment),
        [color, textAlignment, truncate, italic, weight, variant, element]
      )
    );

    const childElement = createElement(
      element,
      {
        className: styles,
        ref,
      },
      children
    );

    const getTooltipText = (children: NonNullable<React.ReactNode>) => {
      const html = ReactDomServer.renderToStaticMarkup(<>{children}</>);
      const getRidOfTags = html.replace(/(<([^>]+)>)/gi, '');
      return getRidOfTags;
    };

    const tooltipText = typeof children === 'string' ? children : getTooltipText(children);

    if (truncate === false) {
      return childElement;
    } else {
      return <Tooltip content={tooltipText}>{childElement}</Tooltip>;
    }
  }
);

Text.displayName = 'Text';

const getTextStyles = (
  theme: GrafanaTheme2,
  element?: TextProps['element'],
  variant?: keyof ThemeTypographyVariantTypes,
  color?: TextProps['color'],
  weight?: TextProps['weight'],
  truncate?: TextProps['truncate'],
  italic?: TextProps['italic'],
  textAlignment?: TextProps['textAlignment']
) => {
  return css([
    {
      margin: 0,
      padding: 0,
      ...customVariant(theme, element, variant),
    },
    variant && {
      ...theme.typography[variant],
    },
    color && {
      color: customColor(color, theme),
    },
    weight && {
      fontWeight: customWeight(weight, theme),
    },
    truncate && {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    italic && {
      fontStyle: 'italic',
    },
    textAlignment && {
      textAlign: textAlignment,
    },
  ]);
};
