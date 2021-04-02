import React, { FC } from 'react';
import Page from 'app/core/components/Page/Page';
import { getNavModel } from 'app/core/selectors/navModel';
import { useSelector } from 'react-redux';
import { StoreState } from 'app/types/store';
import { useStyles } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme } from '@grafana/data';

interface Props {
  pageId: string;
  isLoading?: boolean;
}

export const AlertingPageWrapper: FC<Props> = ({ children, pageId, isLoading }) => {
  const navModel = getNavModel(
    useSelector((state: StoreState) => state.navIndex),
    pageId
  );

  const styles = useStyles(getStyles);

  return (
    <Page navModel={navModel} className={styles.page}>
      <Page.Contents isLoading={isLoading}>{children}</Page.Contents>
    </Page>
  );
};

export const getStyles = (theme: GrafanaTheme) => ({
  page: css`
    .page-container {
      max-width: ${theme.breakpoints.xxl};
    }
  `,
});
