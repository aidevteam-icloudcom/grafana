import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { AngularDeprecationNotice } from './AngularDeprecationNotice';

function localStorageKey(dsUid: string) {
  return `grafana.angularDeprecation.dashboardNotice.isDismissed.${dsUid}`;
}

describe('AngularDeprecationNotice', () => {
  const noticeText = /This dashboard depends on Angular/i;
  const dsUid = 'abc';

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should render', () => {
    render(<AngularDeprecationNotice dashboardUid={dsUid} />);
    expect(screen.getByText(noticeText)).toBeInTheDocument();
  });

  it('should be dismissable', async () => {
    render(<AngularDeprecationNotice dashboardUid={dsUid} />);
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
    await userEvent.click(closeButton);
    expect(screen.queryByText(noticeText)).not.toBeInTheDocument();
  });

  it('should persist dismission status in localstorage', async () => {
    render(<AngularDeprecationNotice dashboardUid={dsUid} />);
    expect(window.localStorage.getItem(localStorageKey(dsUid))).toBeNull();
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
    await userEvent.click(closeButton);
    expect(window.localStorage.getItem(localStorageKey(dsUid))).toBe('true');
  });

  it('should not re-render alert if already dismissed', () => {
    window.localStorage.setItem(localStorageKey(dsUid), 'true');
    render(<AngularDeprecationNotice dashboardUid={dsUid} />);
    expect(screen.queryByText(noticeText)).not.toBeInTheDocument();
  });
});
