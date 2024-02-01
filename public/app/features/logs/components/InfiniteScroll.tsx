import { css } from '@emotion/css';
import React, { ReactNode, useEffect, useRef, useState } from 'react';

import { AbsoluteTimeRange, LogRowModel, TimeRange } from '@grafana/data';
import { convertRawToRange, isRelativeTime, isRelativeTimeRange } from '@grafana/data/src/datetime/rangeutil';
import { config, reportInteraction } from '@grafana/runtime';
import { LogsSortOrder, TimeZone } from '@grafana/schema';

import { LoadingIndicator } from './LoadingIndicator';

export type Props = {
  children: ReactNode;
  loading: boolean;
  loadMoreLogs?: (range: AbsoluteTimeRange) => void;
  range: TimeRange;
  rows: LogRowModel[];
  scrollElement?: HTMLDivElement;
  sortOrder: LogsSortOrder;
  timeZone: TimeZone;
};

export const InfiniteScroll = ({
  children,
  loading,
  loadMoreLogs,
  range,
  rows,
  scrollElement,
  sortOrder,
  timeZone,
}: Props) => {
  const [upperOutOfRange, setUpperOutOfRange] = useState(false);
  const [lowerOutOfRange, setLowerOutOfRange] = useState(false);
  const [upperLoading, setUpperLoading] = useState(false);
  const [lowerLoading, setLowerLoading] = useState(false);
  const lastScroll = useRef<number>(scrollElement?.scrollTop || 0);

  useEffect(() => {
    setUpperOutOfRange(false);
    setLowerOutOfRange(false);
  }, [range, rows, sortOrder]);

  useEffect(() => {
    if (!loading) {
      setUpperLoading(false);
      setLowerLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (lowerLoading && scrollElement) {
      scrollElement.scrollTo(0, scrollElement.scrollHeight - scrollElement.clientHeight);
    }
  }, [lowerLoading, scrollElement]);

  useEffect(() => {
    if (!scrollElement || !loadMoreLogs) {
      return;
    }

    function handleScroll(event: Event | WheelEvent) {
      if (!scrollElement || !loadMoreLogs || !rows.length || loading || !config.featureToggles.logsInfiniteScrolling) {
        return;
      }
      event.stopImmediatePropagation();
      const scrollDirection = shouldLoadMore(event, scrollElement, lastScroll.current);
      lastScroll.current = scrollElement.scrollTop;
      if (scrollDirection === ScrollDirection.NoScroll) {
        return;
      } else if (scrollDirection === ScrollDirection.Top) {
        scrollTop();
      } else {
        scrollBottom();
      }
    }

    function scrollTop() {
      const newRange = canScrollTop(getVisibleRange(rows), range, timeZone, sortOrder);
      if (!newRange) {
        setUpperOutOfRange(true);
        return;
      }
      setUpperOutOfRange(false);
      loadMoreLogs?.(newRange);
      setUpperLoading(true);
      reportInteraction('grafana_logs_infinite_scrolling', {
        direction: 'top',
        sort_order: sortOrder,
      });
    }

    function scrollBottom() {
      const newRange = canScrollBottom(getVisibleRange(rows), range, timeZone, sortOrder);
      if (!newRange) {
        setLowerOutOfRange(true);
        return;
      }
      setLowerOutOfRange(false);
      loadMoreLogs?.(newRange);
      setLowerLoading(true);
      reportInteraction('grafana_logs_infinite_scrolling', {
        direction: 'bottom',
        sort_order: sortOrder,
      });
    }

    scrollElement.addEventListener('scroll', handleScroll);
    scrollElement.addEventListener('wheel', handleScroll);

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      scrollElement.removeEventListener('wheel', handleScroll);
    };
  }, [loadMoreLogs, loading, range, rows, scrollElement, sortOrder, timeZone]);

  // We allow "now" to move when using relative time, so we hide the message so it doesn't flash.
  const hideTopMessage = sortOrder === LogsSortOrder.Descending && isRelativeTime(range.raw.to);
  const hideBottomMessage = sortOrder === LogsSortOrder.Ascending && isRelativeTime(range.raw.to);

  return (
    <>
      {upperLoading && <LoadingIndicator adjective={sortOrder === LogsSortOrder.Descending ? 'newer' : 'older'} />}
      {!hideTopMessage && upperOutOfRange && outOfRangeMessage}
      {children}
      {!hideBottomMessage && lowerOutOfRange && outOfRangeMessage}
      {lowerLoading && <LoadingIndicator adjective={sortOrder === LogsSortOrder.Descending ? 'older' : 'newer'} />}
    </>
  );
};

const styles = {
  messageContainer: css({
    textAlign: 'center',
    padding: 0.25,
  }),
};

const outOfRangeMessage = (
  <div className={styles.messageContainer} data-testid="end-of-range">
    End of the selected time range.
  </div>
);

enum ScrollDirection {
  Top = -1,
  Bottom = 1,
  NoScroll = 0,
}
function shouldLoadMore(event: Event | WheelEvent, element: HTMLDivElement, lastScroll: number): ScrollDirection {
  // Disable behavior if there is no scroll
  if (element.scrollHeight <= element.clientHeight) {
    return ScrollDirection.NoScroll;
  }
  const delta = event instanceof WheelEvent ? event.deltaY : element.scrollTop - lastScroll;
  if (delta === 0) {
    return ScrollDirection.NoScroll;
  }
  const scrollDirection = delta < 0 ? ScrollDirection.Top : ScrollDirection.Bottom;
  const diff =
    scrollDirection === ScrollDirection.Top
      ? element.scrollTop
      : element.scrollHeight - element.scrollTop - element.clientHeight;

  return diff <= 1 ? scrollDirection : ScrollDirection.NoScroll;
}

function getVisibleRange(rows: LogRowModel[]) {
  const firstTimeStamp = rows[0].timeEpochMs;
  const lastTimeStamp = rows[rows.length - 1].timeEpochMs;

  const visibleRange =
    lastTimeStamp < firstTimeStamp
      ? { from: lastTimeStamp, to: firstTimeStamp }
      : { from: firstTimeStamp, to: lastTimeStamp };

  return visibleRange;
}

function getPrevRange(visibleRange: AbsoluteTimeRange, currentRange: TimeRange) {
  return { from: currentRange.from.valueOf(), to: visibleRange.from };
}

function getNextRange(visibleRange: AbsoluteTimeRange, currentRange: TimeRange, timeZone: TimeZone) {
  // When requesting new logs, update the current range if using relative time ranges.
  currentRange = updateCurrentRange(currentRange, timeZone);
  return { from: visibleRange.to, to: currentRange.to.valueOf() };
}

export const SCROLLING_THRESHOLD = 1e3;

// To get more logs, the difference between the visible range and the current range should be 1 second or more.
function canScrollTop(
  visibleRange: AbsoluteTimeRange,
  currentRange: TimeRange,
  timeZone: TimeZone,
  sortOrder: LogsSortOrder
): AbsoluteTimeRange | false {
  if (sortOrder === LogsSortOrder.Descending) {
    // When requesting new logs, update the current range if using relative time ranges.
    currentRange = updateCurrentRange(currentRange, timeZone);
    const canScroll = currentRange.to.valueOf() - visibleRange.to > SCROLLING_THRESHOLD;
    return canScroll ? getNextRange(visibleRange, currentRange, timeZone) : false;
  }

  const canScroll = Math.abs(currentRange.from.valueOf() - visibleRange.from) > SCROLLING_THRESHOLD;
  return canScroll ? getPrevRange(visibleRange, currentRange) : false;
}

function canScrollBottom(
  visibleRange: AbsoluteTimeRange,
  currentRange: TimeRange,
  timeZone: TimeZone,
  sortOrder: LogsSortOrder
): AbsoluteTimeRange | false {
  if (sortOrder === LogsSortOrder.Descending) {
    const canScroll = Math.abs(currentRange.from.valueOf() - visibleRange.from) > SCROLLING_THRESHOLD;
    return canScroll ? getPrevRange(visibleRange, currentRange) : false;
  }
  // When requesting new logs, update the current range if using relative time ranges.
  currentRange = updateCurrentRange(currentRange, timeZone);
  const canScroll = currentRange.to.valueOf() - visibleRange.to > SCROLLING_THRESHOLD;
  return canScroll ? getNextRange(visibleRange, currentRange, timeZone) : false;
}

// Given a TimeRange, returns a new instance if using relative time, or else the same.
function updateCurrentRange(timeRange: TimeRange, timeZone: TimeZone) {
  return isRelativeTimeRange(timeRange.raw) ? convertRawToRange(timeRange.raw, timeZone) : timeRange;
}
