import { render } from '@testing-library/react';
import React from 'react';

import { SortOrder } from '../../../core/utils/richHistoryTypes';
import { ExploreId } from '../../../types/explore';

import { Tabs } from './RichHistory';
import { RichHistoryContainer, Props } from './RichHistoryContainer';

jest.mock('../state/selectors', () => ({ getExploreDatasources: jest.fn() }));

const setup = (propOverrides?: Partial<Props>) => {
  const props: Props = {
    width: 500,
    exploreId: ExploreId.left,
    activeDatasourceInstance: 'Test datasource',
    richHistory: [],
    firstTab: Tabs.RichHistory,
    deleteRichHistory: jest.fn(),
    initRichHistory: jest.fn(),
    updateHistorySearchFilters: jest.fn(),
    updateHistorySettings: jest.fn(),
    onClose: jest.fn(),
    richHistorySearchFilters: {
      search: '',
      sortOrder: SortOrder.Descending,
      datasourceFilters: [],
      from: 0,
      to: 7,
    },
    richHistorySettings: {
      retentionPeriod: 0,
      starredTabAsFirstTab: false,
      activeDatasourceOnly: true,
      lastUsedDatasourceFilters: [],
    },
  };

  Object.assign(props, propOverrides);

  return render(<RichHistoryContainer {...props} />);
};

describe('RichHistoryContainer', () => {
  it('should show loading message when settings and filters are not ready', () => {
    const { container } = setup({ richHistorySearchFilters: undefined, richHistorySettings: undefined });
    expect(container).toHaveTextContent('Loading...');
  });
  it('should render component with correct width', () => {
    const { container } = setup();
    expect(container.firstElementChild!.getAttribute('style')).toContain('width: 531.5px');
  });
  it('should render component with correct height', () => {
    const { container } = setup();
    expect(container.firstElementChild!.getAttribute('style')).toContain('height: 400px');
  });
  it('should re-request rich history every time the component is mounted', () => {
    const initRichHistory = jest.fn();
    const { unmount } = setup({ initRichHistory });
    expect(initRichHistory).toBeCalledTimes(1);

    unmount();
    expect(initRichHistory).toBeCalledTimes(1);

    setup({ initRichHistory });
    expect(initRichHistory).toBeCalledTimes(2);
  });
});
