// Copyright (c) 2017 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { render, screen } from '@testing-library/react';
import React from 'react';

import { createTheme } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';

import TracePageSearchBar, { getStyles } from './TracePageSearchBar';

const defaultProps = {
  forwardedRef: React.createRef(),
  navigable: true,
  searchBarSuffix: 'suffix',
  searchValue: 'value',
};

describe('<TracePageSearchBar>', () => {
  describe('truthy textFilter', () => {
    it('renders UiFindInput with correct props', () => {
      render(<TracePageSearchBar {...defaultProps} />);
      const uiFindInput = screen.getByTestId(selectors.components.TraceViewer.uiFindInput);
      expect(uiFindInput['value']).toEqual('value');
      const suffix = screen.getByTestId(selectors.components.TraceViewer.tracePageSearchBarSuffix);
      const theme = createTheme();
      expect(suffix['className']).toBe(getStyles(theme).TracePageSearchBarSuffix);
      expect(suffix.textContent).toBe('suffix');
    });

    it('renders buttons', () => {
      render(<TracePageSearchBar {...defaultProps} />);
      const nextResButton = screen.queryByTestId(selectors.components.TraceViewer.tracePageSearchBarNextResultButton);
      const prevResButton = screen.queryByTestId(selectors.components.TraceViewer.tracePageSearchBarNextResultButton);
      expect(nextResButton).toBeInTheDocument();
      expect(prevResButton).toBeInTheDocument();
      expect(nextResButton['disabled']).toBe(false);
      expect(prevResButton['disabled']).toBe(false);
    });

    it('only shows navigable buttons when navigable is true', () => {
      const props = {
        ...defaultProps,
        navigable: false,
      };
      render(<TracePageSearchBar {...props} />);
      expect(
        screen.queryByTestId(selectors.components.TraceViewer.tracePageSearchBarNextResultButton)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId(selectors.components.TraceViewer.tracePageSearchBarPrevResultButton)
      ).not.toBeInTheDocument();
    });
  });

  describe('falsy textFilter', () => {
    beforeEach(() => {
      const props = {
        ...defaultProps,
        searchValue: '',
      };
      render(<TracePageSearchBar {...props} />);
    });

    it('does not render suffix', () => {
      expect(screen.queryByTestId(selectors.components.TraceViewer.tracePageSearchBarSuffix)).not.toBeInTheDocument();
    });

    it('renders buttons', () => {
      expect(
        screen.queryByTestId(selectors.components.TraceViewer.tracePageSearchBarNextResultButton)
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId(selectors.components.TraceViewer.tracePageSearchBarPrevResultButton)
      ).toBeInTheDocument();
    });
  });
});
