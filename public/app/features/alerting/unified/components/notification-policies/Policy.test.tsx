import { screen, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { noop } from 'lodash';
import React from 'react';
import { Router } from 'react-router-dom';

import { locationService } from '@grafana/runtime';
import { contextSrv } from 'app/core/core';
import {
  AlertmanagerGroup,
  MatcherOperator,
  ObjectMatcher,
  RouteWithID,
} from 'app/plugins/datasource/alertmanager/types';

import { GRAFANA_RULES_SOURCE_NAME } from '../../utils/datasource';

import { Policy } from './Policy';

beforeAll(() => {
  userEvent.setup();
});

describe('Policy', () => {
  beforeAll(() => {
    jest.spyOn(contextSrv, 'hasPermission').mockReturnValue(true);
  });

  it('should render a default policy for Grafana managed rules', async () => {
    const onEditPolicy = jest.fn();
    const onAddPolicy = jest.fn();
    const onDeletePolicy = jest.fn();
    const onShowAlertInstances = jest.fn((alertGroups: AlertmanagerGroup[], matchers?: ObjectMatcher[] | undefined) => {
      throw new Error('Function not implemented.');
    });

    const routeTree = mockRoutes;

    renderPolicy(
      <Policy
        routeTree={routeTree}
        currentRoute={routeTree}
        receivers={[]}
        contactPointsState={{}}
        alertManagerSourceName={GRAFANA_RULES_SOURCE_NAME}
        onEditPolicy={onEditPolicy}
        onAddPolicy={onAddPolicy}
        onDeletePolicy={onDeletePolicy}
        onShowAlertInstances={onShowAlertInstances}
      />
    );

    // should have default policy
    const defaultPolicy = screen.getByTestId('am-root-route-container');
    expect(defaultPolicy).toBeInTheDocument();
    expect(within(defaultPolicy).getByText('Default policy')).toBeVisible();

    // should be editable
    const editDefaultPolicy = within(defaultPolicy).getByRole('button', { name: 'Edit' });
    expect(editDefaultPolicy).not.toBeDisabled();

    await userEvent.click(editDefaultPolicy);
    expect(onEditPolicy).toHaveBeenCalledWith(routeTree, true);

    // click "more actions" and check if we can delete
    await userEvent.click(within(defaultPolicy).getByTestId('more-actions'));
    expect(await screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();

    // default policy should show the metadata

    // no continue matching
    expect(within(defaultPolicy).queryByTestId('continue-matching')).not.toBeInTheDocument();

    // for matching instances
    expect(within(defaultPolicy).getByTestId('matching-instances')).toHaveTextContent('0instances');

    // for contact point
    expect(within(defaultPolicy).getByTestId('contact-point')).toHaveTextContent('grafana-default-email');
    expect(within(defaultPolicy).getByRole('link', { name: 'grafana-default-email' })).toBeInTheDocument();

    // for grouping
    expect(within(defaultPolicy).getByTestId('grouping')).toHaveTextContent('grafana_folder, alertname');

    // no mute timings
    expect(within(defaultPolicy).queryByTestId('mute-timings')).not.toBeInTheDocument();

    // for timing options
    expect(within(defaultPolicy).getByTestId('timing-options')).toHaveTextContent(
      'Wait30s to group instances,5m before sending updates'
    );

    // should have custom policies
    const customPolicies = screen.getAllByTestId('am-route-container');
    expect(customPolicies).toHaveLength(3);

    // all policies should be editable and deletable
    for (const container of customPolicies) {
      const policy = within(container);
      expect(policy.getByRole('button', { name: 'Edit' })).not.toBeDisabled();

      // click "more actions" and check if we can delete
      await userEvent.click(policy.getByTestId('more-actions'));
      expect(await screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeDisabled();

      await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
      expect(onDeletePolicy).toHaveBeenCalled();
    }

    // first custom policy should have the correct information
    const firstPolicy = customPolicies[0];
    expect(within(firstPolicy).getByTestId('label-matchers')).toHaveTextContent(/^team \= operations$/);
    expect(within(firstPolicy).getByTestId('continue-matching')).toBeInTheDocument();
    expect(within(firstPolicy).getByTestId('matching-instances')).toHaveTextContent('0instances');
    expect(within(firstPolicy).getByTestId('contact-point')).toHaveTextContent('provisioned-contact-point');
    expect(within(firstPolicy).getByTestId('mute-timings')).toHaveTextContent('Muted whenmt-1');
    expect(within(firstPolicy).getByTestId('inherited-properties')).toHaveTextContent('Inherited2 properties');

    // second custom policy should be correct
    const secondPolicy = customPolicies[1];
    expect(within(secondPolicy).getByTestId('label-matchers')).toHaveTextContent(/^region \= EMEA$/);
    expect(within(secondPolicy).queryByTestId('continue-matching')).not.toBeInTheDocument();
    expect(within(secondPolicy).queryByTestId('mute-timings')).not.toBeInTheDocument();
    expect(within(secondPolicy).getByTestId('inherited-properties')).toHaveTextContent('Inherited4 properties');

    // third custom policy should be correct
    const thirdPolicy = customPolicies[2];
    expect(within(thirdPolicy).getByTestId('label-matchers')).toHaveTextContent(
      /^foo = barbar = bazbaz = quxasdf = asdftype = diskand 1 more$/
    );
  });

  it('should not allow editing readOnly policy tree', () => {
    const routeTree: RouteWithID = { id: '0', routes: [{ id: '1' }] };

    renderPolicy(
      <Policy
        readOnly
        routeTree={routeTree}
        currentRoute={routeTree}
        receivers={[]}
        contactPointsState={{}}
        alertManagerSourceName={GRAFANA_RULES_SOURCE_NAME}
        onEditPolicy={noop}
        onAddPolicy={noop}
        onDeletePolicy={noop}
        onShowAlertInstances={noop}
      />
    );

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });
});

const renderPolicy = (element: JSX.Element) =>
  render(<Router history={locationService.getHistory()}>{element}</Router>);

const eq = MatcherOperator.equal;

const mockRoutes: RouteWithID = {
  id: '0',
  receiver: 'grafana-default-email',
  group_by: ['grafana_folder', 'alertname'],
  routes: [
    {
      id: '1',
      receiver: 'provisioned-contact-point',
      object_matchers: [['team', eq, 'operations']],
      mute_time_intervals: ['mt-1'],
      continue: true,
      routes: [
        {
          id: '2',
          object_matchers: [['region', eq, 'EMEA']],
        },
        {
          id: '3',
          receiver: 'grafana-default-email',
          object_matchers: [
            ['foo', eq, 'bar'],
            ['bar', eq, 'baz'],
            ['baz', eq, 'qux'],
            ['asdf', eq, 'asdf'],
            ['type', eq, 'disk'],
            ['severity', eq, 'critical'],
          ],
        },
      ],
    },
  ],
  group_wait: '30s',
};
