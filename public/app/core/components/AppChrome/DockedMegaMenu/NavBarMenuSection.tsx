import { css, cx } from '@emotion/css';
import React from 'react';
import { useLocalStorage } from 'react-use';

import { GrafanaTheme2, NavModelItem } from '@grafana/data';
import { Button, Icon, useStyles2 } from '@grafana/ui';

import { NavBarItemIcon } from './NavBarItemIcon';
import { NavBarMenuItem } from './NavBarMenuItem';
import { NavFeatureHighlight } from './NavFeatureHighlight';
import { hasChildMatch } from './utils';

interface Props {
  link: NavModelItem;
  activeItem?: NavModelItem;
  onClose?: () => void;
}

export function NavBarMenuSection({ link, activeItem, onClose }: Props) {
  const styles = useStyles2(getStyles);
  const FeatureHighlightWrapper = link.highlightText ? NavFeatureHighlight : React.Fragment;
  const isActive = link === activeItem;
  const hasActiveChild = hasChildMatch(link, activeItem);
  const [sectionExpanded, setSectionExpanded] =
    useLocalStorage(`grafana.navigation.expanded[${link.text}]`, false) ?? Boolean(hasActiveChild);
  const showExpandButton = linkHasChildren(link) || link.emptyMessage;

  return (
    <>
      <div className={styles.collapsibleSectionWrapper}>
        <NavBarMenuItem
          isActive={isActive}
          onClick={() => {
            link.onClick?.();
            onClose?.();
          }}
          target={link.target}
          url={link.url}
        >
          <div
            className={cx(styles.labelWrapper, {
              [styles.isActive]: isActive,
              [styles.hasActiveChild]: hasActiveChild,
            })}
          >
            <FeatureHighlightWrapper>
              <NavBarItemIcon link={link} />
            </FeatureHighlightWrapper>
            {link.text}
          </div>
        </NavBarMenuItem>
        {showExpandButton && (
          <Button
            aria-label={`${sectionExpanded ? 'Collapse' : 'Expand'} section ${link.text}`}
            variant="secondary"
            fill="text"
            className={styles.collapseButton}
            onClick={() => setSectionExpanded(!sectionExpanded)}
          >
            <Icon name={sectionExpanded ? 'angle-up' : 'angle-down'} size="xl" />
          </Button>
        )}
      </div>
      {showExpandButton && sectionExpanded && (
        <ul className={styles.children}>
          {linkHasChildren(link) ? (
            link.children
              .filter((childLink) => !childLink.isCreateAction)
              .map((childLink) => (
                <NavBarMenuSection
                  key={`${link.text}-${childLink.text}`}
                  link={childLink}
                  activeItem={activeItem}
                  onClose={onClose}
                />
              ))
          ) : (
            <div className={styles.emptyMessage}>{link.emptyMessage}</div>
          )}
        </ul>
      )}
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  children: css({
    display: 'flex',
    flexDirection: 'column',
  }),
  collapsibleSectionWrapper: css({
    alignItems: 'center',
    display: 'flex',
  }),
  collapseButton: css({
    color: theme.colors.text.disabled,
    padding: theme.spacing(0, 0.5),
    marginRight: theme.spacing(1),
  }),
  emptyMessage: css({
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    padding: theme.spacing(1, 1.5, 1, 7),
  }),
  labelWrapper: css({
    display: 'grid',
    fontSize: theme.typography.pxToRem(14),
    gridAutoFlow: 'column',
    gridTemplateColumns: `${theme.spacing(7)} auto`,
    placeItems: 'center',
    fontWeight: theme.typography.fontWeightMedium,
  }),
  isActive: css({
    color: theme.colors.text.primary,

    '&::before': {
      display: 'block',
      content: '" "',
      height: theme.spacing(3),
      position: 'absolute',
      left: theme.spacing(1),
      top: '50%',
      transform: 'translateY(-50%)',
      width: theme.spacing(0.5),
      borderRadius: theme.shape.radius.default,
      backgroundImage: theme.colors.gradients.brandVertical,
    },
  }),
  hasActiveChild: css({
    color: theme.colors.text.primary,
  }),
});

function linkHasChildren(link: NavModelItem): link is NavModelItem & { children: NavModelItem[] } {
  return Boolean(link.children && link.children.length > 0);
}
