import { cx, css } from '@emotion/css';
import React from 'react';
import SVG from 'react-inlinesvg';

import { GrafanaTheme2 } from '@grafana/data';

import { useStyles2 } from '../../themes';
import { IconSize, isIconSize } from '../../types';
import { Icon } from '../Icon/Icon';
import { getIconRoot, getIconSubDir } from '../Icon/utils';

export interface Props {
  className?: string;
  style?: React.CSSProperties;
  iconClassName?: string;
  inline?: boolean;
  size?: IconSize | DeprecatedSize;
}

/**
 * @deprecated
 * use a predefined size, e.g. 'md' or 'lg' instead
 */
type DeprecatedSize = number | string;

/**
 * @public
 */
export const Spinner = ({ className, inline = false, iconClassName, style, size = 'md' }: Props) => {
  const styles = useStyles2(getStyles);

  const deprecatedStyles = useStyles2(getDeprecatedStyles, size);

  // this entire if statement is handling the deprecated size prop
  // TODO remove once we fully remove the deprecated type
  if (typeof size !== 'string' || !isIconSize(size)) {
    const iconRoot = getIconRoot();
    const iconName = 'spinner';
    const subDir = getIconSubDir(iconName, 'default');
    const svgPath = `${iconRoot}${subDir}/${iconName}.svg`;
    return (
      <div
        data-testid="Spinner"
        style={style}
        className={cx(
          {
            [styles.inline]: inline,
          },
          deprecatedStyles.wrapper,
          className
        )}
      >
        <SVG
          src={svgPath}
          width={size}
          height={size}
          className={cx('fa-spin', deprecatedStyles.icon, className)}
          style={style}
        />
      </div>
    );
  }

  return (
    <div
      data-testid="Spinner"
      style={style}
      className={cx(
        {
          [styles.inline]: inline,
        },
        className
      )}
    >
      <Icon className={cx('fa-spin', iconClassName)} name="spinner" size={size} aria-label="loading spinner" />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  inline: css({
    display: 'inline-block',
  }),
});

// TODO remove once we fully remove the deprecated type
const getDeprecatedStyles = (theme: GrafanaTheme2, size: number | string) => ({
  wrapper: css({
    fontSize: typeof size === 'string' ? size : `${size}px`,
  }),
  icon: css({
    display: 'inline-block',
    fill: 'currentColor',
    flexShrink: 0,
    label: 'Icon',
    // line-height: 0; is needed for correct icon alignment in Safari
    lineHeight: 0,
    verticalAlign: 'middle',
  }),
});
