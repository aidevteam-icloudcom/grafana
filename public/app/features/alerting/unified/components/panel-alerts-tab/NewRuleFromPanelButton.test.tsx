import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// @todo: replace barrel import path
import { createDashboardModelFixture } from 'app/features/dashboard/state/__fixtures__/dashboardFixtures';
import { PanelModel } from 'app/features/dashboard/state/index';

import * as analytics from '../../Analytics';

import { NewRuleFromPanelButton } from './NewRuleFromPanelButton';

jest.mock('app/types', () => {
  const original = jest.requireActual('app/types');
  return {
    ...original,
    useSelector: jest.fn(),
  };
});

jest.mock('react-router-dom', () => ({
  useLocation: () => ({
    pathname: 'localhost:3000/example/path',
  }),
}));

jest.spyOn(analytics, 'logInfo');

jest.mock('react-use', () => ({
  ...jest.requireActual('react-use'),
  useAsync: () => ({ loading: false, value: {} }),
}));

describe('Analytics', () => {
  it('Sends log info when creating an alert rule from a panel', async () => {
    const panel = new PanelModel({
      id: 123,
    });
    const dashboard = createDashboardModelFixture({
      id: 1,
    });
    render(<NewRuleFromPanelButton panel={panel} dashboard={dashboard} />);

    const button = screen.getByText('New alert rule');

    button.addEventListener('click', (event) => event.preventDefault(), false);

    await userEvent.click(button);

    expect(analytics.logInfo).toHaveBeenCalledWith(analytics.LogMessages.alertRuleFromPanel);
  });
});
