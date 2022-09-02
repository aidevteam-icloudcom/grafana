import { css } from '@emotion/css';
import React, { FC, useState } from 'react';

import { PanelMenuItem } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Icon, toIconName, useTheme } from '@grafana/ui';

interface Props {
  children?: any;
}

export const PanelHeaderMenuItem: FC<Props & PanelMenuItem> = (props) => {
  const [ref, setRef] = useState<HTMLLIElement | null>(null);
  const isSubMenu = props.type === 'submenu';
  const isDivider = props.type === 'divider';
  const theme = useTheme();
  const menuIconClassName = css`
    margin-right: ${theme.spacing.sm};
    a::after {
      display: none;
    }
  `;
  const shortcutIconClassName = css`
    position: absolute;
    top: 7px;
    right: ${theme.spacing.xs};
    color: ${theme.colors.textWeak};
  `;

  const icon = props.iconClassName ? toIconName(props.iconClassName) : undefined;

  return isDivider ? (
    <li className="divider" />
  ) : (
    <li className={isSubMenu ? `dropdown-submenu ${getDropdownLocationCssClass(ref)}` : undefined} ref={setRef}>
      <a onClick={props.onClick} href={props.href}>
        {icon && <Icon name={icon} className={menuIconClassName} />}

        <span className="dropdown-item-text" aria-label={selectors.components.Panels.Panel.headerItems(props.text)}>
          {props.text}
          {isSubMenu && <Icon name="angle-right" className={shortcutIconClassName} />}
        </span>

        {props.shortcut && (
          <span className="dropdown-menu-item-shortcut">
            <Icon name="keyboard" className={menuIconClassName} /> {props.shortcut}
          </span>
        )}
      </a>
      {props.children}
    </li>
  );
};

function getDropdownLocationCssClass(element: HTMLElement | null) {
  if (!element) {
    return 'invisible';
  }

  const wrapperPos = element.parentElement!.getBoundingClientRect();
  const pos = element.getBoundingClientRect();

  if (pos.width === 0) {
    return 'invisible';
  }

  if (wrapperPos.right + pos.width + 10 > window.innerWidth) {
    return 'pull-left';
  } else {
    return 'pull-right';
  }
}
