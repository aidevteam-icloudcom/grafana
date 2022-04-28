import React, { FC } from 'react';
import { css, cx } from '@emotion/css';
import { Tab, TabsBar, Icon, IconName, useStyles2 } from '@grafana/ui';
import { NavModel, NavModelItem, NavModelBreadcrumb, GrafanaTheme2 } from '@grafana/data';
import { PanelHeaderMenuItem } from 'app/features/dashboard/dashgrid/PanelHeader/PanelHeaderMenuItem';

export interface Props {
  model: NavModel;
  vertical?: boolean;
  tabsDataTestId?: string;
}

const SelectNav = ({ children, customCss }: { children: NavModelItem[]; customCss: string }) => {
  if (!children || children.length === 0) {
    return null;
  }

  const defaultSelectedItem = children.find((navItem) => {
    return navItem.active === true;
  });

  return (
    <div className={`gf-form-select-wrapper width-20 ${customCss}`}>
      <div className="dropdown">
        <div className="gf-form-input dropdown-toggle" data-toggle="dropdown">
          {defaultSelectedItem?.text}
        </div>
        <ul className="dropdown-menu dropdown-menu--menu">
          {children.map((navItem: NavModelItem) => {
            if (navItem.hideFromTabs) {
              // TODO: Rename hideFromTabs => hideFromNav
              return null;
            }
            return (
              <PanelHeaderMenuItem
                key={navItem.url}
                iconClassName={navItem.icon}
                text={navItem.text}
                href={navItem.url}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
};

const Navigation = ({
  children,
  vertical = false,
  dataTestId = '',
}: {
  children: NavModelItem[];
  vertical?: boolean;
  dataTestId?: string;
  tabsdataTestId?: string;
}) => {
  const styles = useStyles2(getStyles);

  if (!children || children.length === 0) {
    return null;
  }

  return (
    <nav className={cx({ [styles.verticalNav]: !!vertical })}>
      <SelectNav customCss="page-header__select-nav">{children}</SelectNav>
      <TabsBar className="page-header__tabs" hideBorder={true} vertical={vertical} dataTestId={dataTestId}>
        {children.map((child, index) => {
          return (
            !child.hideFromTabs && (
              <Tab
                label={child.text}
                active={child.active}
                key={`${child.url}-${index}`}
                icon={child.icon as IconName}
                href={child.url}
              />
            )
          );
        })}
      </TabsBar>
    </nav>
  );
};

export const PageHeader: FC<Props> = ({ model, vertical = false, tabsDataTestId = '' }) => {
  const styles = useStyles2(getStyles);

  if (!model) {
    return null;
  }

  const main = model.main;
  const children = main.children;

  return (
    <div className={styles.headerCanvas}>
      <div className="page-container">
        <div className="page-header">
          {renderHeaderTitle(main)}
          {children && children.length && (
            <Navigation vertical={vertical} dataTestId={tabsDataTestId}>
              {children}
            </Navigation>
          )}
        </div>
      </div>
    </div>
  );
};

function renderHeaderTitle(main: NavModelItem) {
  const marginTop = main.icon === 'grafana' ? 12 : 14;

  return (
    <div className="page-header__inner">
      <span className="page-header__logo">
        {main.icon && <Icon name={main.icon as IconName} size="xxxl" style={{ marginTop }} />}
        {main.img && <img className="page-header__img" src={main.img} alt={`logo of ${main.text}`} />}
      </span>

      <div className="page-header__info-block">
        {renderTitle(main.text, main.breadcrumbs ?? [])}
        {main.subTitle && <div className="page-header__sub-title">{main.subTitle}</div>}
      </div>
    </div>
  );
}

function renderTitle(title: string, breadcrumbs: NavModelBreadcrumb[]) {
  if (!title && (!breadcrumbs || breadcrumbs.length === 0)) {
    return null;
  }

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return <h1 className="page-header__title">{title}</h1>;
  }

  const breadcrumbsResult = [];
  for (const bc of breadcrumbs) {
    if (bc.url) {
      breadcrumbsResult.push(
        <a data-testid="breadcrumb-section" className="page-header__link" key={breadcrumbsResult.length} href={bc.url}>
          {bc.title}
        </a>
      );
    } else {
      breadcrumbsResult.push(
        <span data-testid="breadcrumb-section" key={breadcrumbsResult.length}>
          {' '}
          / {bc.title}
        </span>
      );
    }
  }
  breadcrumbsResult.push(
    <span data-testid="breadcrumb-section" key={breadcrumbs.length + 1}>
      {' '}
      / {title}
    </span>
  );

  return <h1 className="page-header__title">{breadcrumbsResult}</h1>;
}

const getStyles = (theme: GrafanaTheme2) => {
  const maxWidthBreakpoint =
    theme.breakpoints.values.xxl + theme.spacing.gridSize * 2 + theme.components.sidemenu.width;
  return {
    headerCanvas: css`
      background: ${theme.colors.background.canvas};
    `,
    verticalNav: css`
      width: 20%;
      @media (min-width: ${maxWidthBreakpoint}px) {
        width: 12%;
      }
    `,
  };
};

export default PageHeader;
