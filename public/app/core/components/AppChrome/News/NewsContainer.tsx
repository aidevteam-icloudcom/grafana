import React from 'react';
import { useToggle } from 'react-use';

import { Drawer, ToolbarButton } from '@grafana/ui';
import { DEFAULT_FEED_URL } from 'app/plugins/panel/news/constants';

import { NewsWrapper } from './NewsWrapper';

interface NewsContainerProps {
  buttonCss?: string;
}

export function NewsContainer({ buttonCss }: NewsContainerProps) {
  const [showNewsDrawer, onToggleShowNewsDrawer] = useToggle(false);

  const onChildClick = () => {
    onToggleShowNewsDrawer(true);
  };

  return (
    <>
      <ToolbarButton className={buttonCss} onClick={onChildClick} iconOnly icon="rss" aria-label="News" />
      {showNewsDrawer && (
        <Drawer title="Latest from the blog" scrollableContent onClose={onToggleShowNewsDrawer}>
          <NewsWrapper feedUrl={DEFAULT_FEED_URL} />
        </Drawer>
      )}
    </>
  );
}
