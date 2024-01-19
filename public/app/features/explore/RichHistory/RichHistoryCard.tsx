import { css, cx } from '@emotion/css';
import React, { useCallback, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { useAsync } from 'react-use';

import { GrafanaTheme2, DataSourceApi } from '@grafana/data';
import { config, getDataSourceSrv, reportInteraction, getAppEvents } from '@grafana/runtime';
import { DataQuery } from '@grafana/schema';
import { TextArea, Button, IconButton, useStyles2, LoadingPlaceholder } from '@grafana/ui';
import { notifyApp } from 'app/core/actions';
import { createSuccessNotification } from 'app/core/copy/appNotification';
import { Trans, t } from 'app/core/internationalization';
import { copyStringToClipboard } from 'app/core/utils/explore';
import { createUrlFromRichHistory, createQueryText } from 'app/core/utils/richHistory';
import { createAndCopyShortLink } from 'app/core/utils/shortLinks';
import { changeDatasource } from 'app/features/explore/state/datasource';
import { starHistoryItem, commentHistoryItem, deleteHistoryItem } from 'app/features/explore/state/history';
import { setQueries } from 'app/features/explore/state/query';
import { dispatch } from 'app/store/store';
import { StoreState } from 'app/types';
import { ShowConfirmModalEvent } from 'app/types/events';
import { RichHistoryQuery } from 'app/types/explore';

function mapStateToProps(state: StoreState, { exploreId }: { exploreId: string }) {
  const explore = state.explore;
  const { datasourceInstance } = explore.panes[exploreId]!;
  return {
    exploreId,
    datasourceInstance,
  };
}

const mapDispatchToProps = {
  changeDatasource,
  deleteHistoryItem,
  commentHistoryItem,
  starHistoryItem,
  setQueries,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

interface OwnProps<T extends DataQuery = DataQuery> {
  queryHistoryItem: RichHistoryQuery<T>;
}

export type Props<T extends DataQuery = DataQuery> = ConnectedProps<typeof connector> & OwnProps<T>;

const getStyles = (theme: GrafanaTheme2) => {
  /* Hard-coded value so all buttons and icons on right side of card are aligned */
  const rightColumnWidth = '240px';
  const rightColumnContentWidth = '170px';

  /* If datasource was removed, card will have inactive color */
  const cardColor = theme.colors.background.secondary;

  return {
    queryCard: css`
      position: relative;
      display: flex;
      flex-direction: column;
      border: 1px solid ${theme.colors.border.weak};
      margin: ${theme.spacing(1)} 0;
      background-color: ${cardColor};
      border-radius: ${theme.shape.radius.default};
      .starred {
        color: ${theme.v1.palette.orange};
      }
    `,
    cardRow: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: ${theme.spacing(1)};
      border-bottom: none;
      :first-of-type {
        border-bottom: 1px solid ${theme.colors.border.weak};
        padding: ${theme.spacing(0.5, 1)};
      }
      img {
        height: ${theme.typography.fontSize}px;
        max-width: ${theme.typography.fontSize}px;
        margin-right: ${theme.spacing(1)};
      }
    `,
    queryActionButtons: css`
      max-width: ${rightColumnContentWidth};
      display: flex;
      justify-content: flex-end;
      font-size: ${theme.typography.size.base};
      button {
        margin-left: ${theme.spacing(1)};
      }
    `,
    queryContainer: css`
      font-weight: ${theme.typography.fontWeightMedium};
      width: calc(100% - ${rightColumnWidth});
    `,
    updateCommentContainer: css`
      width: calc(100% + ${rightColumnWidth});
      margin-top: ${theme.spacing(1)};
    `,
    comment: css`
      overflow-wrap: break-word;
      font-size: ${theme.typography.bodySmall.fontSize};
      font-weight: ${theme.typography.fontWeightRegular};
      margin-top: ${theme.spacing(0.5)};
    `,
    commentButtonRow: css`
      > * {
        margin-top: ${theme.spacing(1)};
        margin-right: ${theme.spacing(1)};
      }
    `,
    textArea: css`
      width: 100%;
    `,
    runButton: css`
      max-width: ${rightColumnContentWidth};
      display: flex;
      justify-content: flex-end;
      button {
        height: auto;
        padding: ${theme.spacing(0.5, 2)};
        line-height: 1.4;
        span {
          white-space: normal !important;
        }
      }
    `,
    loader: css`
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: ${theme.colors.background.secondary};
    `,
  };
};

export function RichHistoryCard(props: Props) {
  const {
    queryHistoryItem,
    commentHistoryItem,
    starHistoryItem,
    deleteHistoryItem,
    changeDatasource,
    exploreId,
    datasourceInstance,
    setQueries,
  } = props;

  const [activeUpdateComment, setActiveUpdateComment] = useState(false);
  const [comment, setComment] = useState<string | undefined>(queryHistoryItem.comment);
  const { value: historyCardData, loading } = useAsync(async () => {
    let datasourceInstance: DataSourceApi | undefined;
    try {
      datasourceInstance = await getDataSourceSrv().get(queryHistoryItem.datasourceUid);
    } catch (e) {}

    return {
      datasourceInstance,
      queries: await Promise.all(
        queryHistoryItem.queries.map(async (query) => {
          let datasource;
          if (datasourceInstance?.meta.mixed) {
            try {
              datasource = await getDataSourceSrv().get(query.datasource);
            } catch (e) {}
          } else {
            datasource = datasourceInstance;
          }

          return {
            query,
            datasource,
          };
        })
      ),
    };
  }, [queryHistoryItem.datasourceUid, queryHistoryItem.queries]);

  const styles = useStyles2(getStyles);

  const onRunQuery = async () => {
    const queriesToRun = queryHistoryItem.queries;
    const differentDataSource = queryHistoryItem.datasourceUid !== datasourceInstance?.uid;
    if (differentDataSource) {
      await changeDatasource({ exploreId, datasource: queryHistoryItem.datasourceUid });
    }
    setQueries(exploreId, queriesToRun);

    reportInteraction('grafana_explore_query_history_run', {
      queryHistoryEnabled: config.queryHistoryEnabled,
      differentDataSource,
    });
  };

  const onCopyQuery = async () => {
    const datasources = [...queryHistoryItem.queries.map((query) => query.datasource?.type || 'unknown')];
    reportInteraction('grafana_explore_query_history_copy_query', {
      datasources,
      mixed: Boolean(historyCardData?.datasourceInstance?.meta.mixed),
    });

    if (loading || !historyCardData) {
      return;
    }

    const queriesText = historyCardData.queries
      .map((query) => {
        return createQueryText(query.query, query.datasource);
      })
      .join('\n');

    copyStringToClipboard(queriesText);
    dispatch(
      notifyApp(
        createSuccessNotification(t('explore.rich-history-notification.query-copied', 'Query copied to clipboard'))
      )
    );
  };

  const onCreateShortLink = async () => {
    const link = createUrlFromRichHistory(queryHistoryItem);
    await createAndCopyShortLink(link);
  };

  const onDeleteQuery = () => {
    const performDelete = (queryId: string) => {
      deleteHistoryItem(queryId);
      dispatch(
        notifyApp(createSuccessNotification(t('explore.rich-history-notification.query-deleted', 'Query deleted')))
      );
      reportInteraction('grafana_explore_query_history_deleted', {
        queryHistoryEnabled: config.queryHistoryEnabled,
      });
    };

    // For starred queries, we want confirmation. For non-starred, we don't.
    if (queryHistoryItem.starred) {
      getAppEvents().publish(
        new ShowConfirmModalEvent({
          title: t('explore.rich-history-card.delete-query-confirmation-title', 'Delete'),
          text: t(
            'explore.rich-history-card.delete-starred-query-confirmation-text',
            'Are you sure you want to permanently delete your starred query?'
          ),
          yesText: t('explore.rich-history-card.confirm-delete', 'Delete'),
          icon: 'trash-alt',
          onConfirm: () => performDelete(queryHistoryItem.id),
        })
      );
    } else {
      performDelete(queryHistoryItem.id);
    }
  };

  const onStarrQuery = () => {
    starHistoryItem(queryHistoryItem.id, !queryHistoryItem.starred);
    reportInteraction('grafana_explore_query_history_starred', {
      queryHistoryEnabled: config.queryHistoryEnabled,
      newValue: !queryHistoryItem.starred,
    });
  };

  const toggleActiveUpdateComment = () => setActiveUpdateComment(!activeUpdateComment);

  const onUpdateComment = () => {
    commentHistoryItem(queryHistoryItem.id, comment);
    setActiveUpdateComment(false);
    reportInteraction('grafana_explore_query_history_commented', {
      queryHistoryEnabled: config.queryHistoryEnabled,
    });
  };

  const onCancelUpdateComment = () => {
    setActiveUpdateComment(false);
    setComment(queryHistoryItem.comment);
  };

  const onKeyDown = (keyEvent: React.KeyboardEvent) => {
    if (keyEvent.key === 'Enter' && (keyEvent.shiftKey || keyEvent.ctrlKey)) {
      onUpdateComment();
    }

    if (keyEvent.key === 'Escape') {
      onCancelUpdateComment();
    }
  };

  const updateComment = (
    <div
      className={styles.updateCommentContainer}
      aria-label={
        comment
          ? t('explore.rich-history-card.update-comment-form', 'Update comment form')
          : t('explore.rich-history-card.add-comment-form', 'Add comment form')
      }
    >
      <TextArea
        onKeyDown={onKeyDown}
        value={comment}
        placeholder={
          comment
            ? undefined
            : t('explore.rich-history-card.optional-description', 'An optional description of what the query does.')
        }
        onChange={(e) => setComment(e.currentTarget.value)}
        className={styles.textArea}
      />
      <div className={styles.commentButtonRow}>
        <Button onClick={onUpdateComment}>
          <Trans i18nKey="explore.rich-history-card.save-comment">Save comment</Trans>
        </Button>
        <Button variant="secondary" onClick={onCancelUpdateComment}>
          <Trans i18nKey="explore.rich-history-card.cancel">Cancel</Trans>
        </Button>
      </div>
    </div>
  );

  const queryActionButtons = (
    <div className={styles.queryActionButtons}>
      <IconButton
        name="comment-alt"
        onClick={toggleActiveUpdateComment}
        tooltip={
          queryHistoryItem.comment?.length > 0
            ? t('explore.rich-history-card.edit-comment-tooltip', 'Edit comment')
            : t('explore.rich-history-card.add-comment-tooltip', 'Add comment')
        }
      />
      <IconButton
        name="copy"
        onClick={onCopyQuery}
        tooltip={t('explore.rich-history-card.copy-query-tooltip', 'Copy query to clipboard')}
      />
      {historyCardData?.datasourceInstance && (
        <IconButton
          name="share-alt"
          onClick={onCreateShortLink}
          tooltip={
            <Trans i18nKey="explore.rich-history-card.copy-shortened-link-tooltip">
              Copy shortened link to clipboard
            </Trans>
          }
        />
      )}
      <IconButton
        name="trash-alt"
        title={t('explore.rich-history-card.delete-query-title', 'Delete query')}
        tooltip={t('explore.rich-history-card.delete-query-tooltip', 'Delete query')}
        onClick={onDeleteQuery}
      />
      <IconButton
        name={queryHistoryItem.starred ? 'favorite' : 'star'}
        iconType={queryHistoryItem.starred ? 'mono' : 'default'}
        onClick={onStarrQuery}
        tooltip={
          queryHistoryItem.starred
            ? t('explore.rich-history-card.unstar-query-tooltip', 'Unstar query')
            : t('explore.rich-history-card.star-query-tooltip', 'Star query')
        }
      />
    </div>
  );

  return (
    <div className={styles.queryCard}>
      <div className={styles.cardRow}>
        <DatasourceInfo dsApi={historyCardData?.datasourceInstance} size="sm" />

        {queryActionButtons}
      </div>
      <div className={cx(styles.cardRow)}>
        <div className={styles.queryContainer}>
          {historyCardData?.queries.map((q, i) => {
            return <Query query={q} key={`${q}-${i}`} showDsInfo={historyCardData?.datasourceInstance?.meta.mixed} />;
          })}
          {!activeUpdateComment && queryHistoryItem.comment && (
            <div
              aria-label={t('explore.rich-history-card.query-comment-label', 'Query comment')}
              className={styles.comment}
            >
              {queryHistoryItem.comment}
            </div>
          )}
          {activeUpdateComment && updateComment}
        </div>
        {!activeUpdateComment && (
          <div className={styles.runButton}>
            <Button
              variant="secondary"
              onClick={onRunQuery}
              disabled={
                !historyCardData?.datasourceInstance || historyCardData.queries.some((query) => !query.datasource)
              }
            >
              {datasourceInstance?.uid === queryHistoryItem.datasourceUid ? (
                <Trans i18nKey="explore.rich-history-card.run-query-button">Run query</Trans>
              ) : (
                <Trans i18nKey="explore.rich-history-card.switch-datasource-button">
                  Switch data source and run query
                </Trans>
              )}
            </Button>
          </div>
        )}
      </div>
      {loading && (
        <LoadingPlaceholder
          text={t('explore.rich-history-card.loading-text', 'loading...')}
          className={styles.loader}
        />
      )}
    </div>
  );
}

const getQueryStyles = (theme: GrafanaTheme2) => ({
  queryRow: css`
    border-top: 1px solid ${theme.colors.border.weak};
    display: flex;
    flex-direction: row;
    padding: 4px 0px;
    gap: 4px;
    :first-child {
      border-top: none;
    }
  `,
  dsInfoContainer: css`
    display: flex;
    align-items: center;
  `,
  queryText: css`
    word-break: break-all;
  `,
});

interface QueryProps {
  query: {
    query: DataQuery;
    datasource?: DataSourceApi;
  };
  /** Show datasource info (icon+name) alongside the query text */
  showDsInfo?: boolean;
}

const Query = ({ query, showDsInfo = false }: QueryProps) => {
  const styles = useStyles2(getQueryStyles);

  return (
    <div className={styles.queryRow}>
      {showDsInfo && (
        <div className={styles.dsInfoContainer}>
          <DatasourceInfo dsApi={query.datasource} size="md" />
          {': '}
        </div>
      )}
      <span aria-label={t('explore.rich-history-card.query-text-label', 'Query text')} className={styles.queryText}>
        {createQueryText(query.query, query.datasource)}
      </span>
    </div>
  );
};

const getDsInfoStyles = (size: 'sm' | 'md') => (theme: GrafanaTheme2) => css`
  display: flex;
  align-items: center;
  font-size: ${theme.typography[size === 'sm' ? 'bodySmall' : 'body'].fontSize};
  font-weight: ${theme.typography.fontWeightMedium};
  white-space: nowrap;
`;

function DatasourceInfo({ dsApi, size }: { dsApi?: DataSourceApi; size: 'sm' | 'md' }) {
  const getStyles = useCallback((theme: GrafanaTheme2) => getDsInfoStyles(size)(theme), [size]);
  const styles = useStyles2(getStyles);

  return (
    <div className={styles}>
      <img
        src={dsApi?.meta.info.logos.small || 'public/img/icn-datasource.svg'}
        alt={dsApi?.type || t('explore.rich-history-card.datasource-not-exist', 'Data source does not exist anymore')}
        aria-label={t('explore.rich-history-card.datasource-icon-label', 'Data source icon')}
      />
      <div aria-label={t('explore.rich-history-card.datasource-name-label', 'Data source name')}>
        {dsApi?.name || t('explore.rich-history-card.datasource-not-exist', 'Data source does not exist anymore')}
      </div>
    </div>
  );
}

export default connector(RichHistoryCard);
