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

import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';

import SpanBarRow from './SpanBarRow';

jest.mock('./SpanTreeOffset', () => {
  // eslint-disable-next-line react/display-name
  return () => <span>SpanTreeOffset</span>;
});

describe('<SpanBarRow>', () => {
  const spanID = 'some-id';
  const props = {
    className: 'a-class-name',
    color: 'color-a',
    columnDivision: '0.5',
    isChildrenExpanded: true,
    isDetailExpanded: false,
    isFilteredOut: false,
    onDetailToggled: jest.fn(),
    onChildrenToggled: jest.fn(),
    operationName: 'op-name',
    numTicks: 5,
    rpc: {
      viewStart: 0.25,
      viewEnd: 0.75,
      color: 'color-b',
      operationName: 'rpc-op-name',
      serviceName: 'rpc-service-name',
    },
    showErrorIcon: false,
    getViewedBounds: () => ({ start: 0, end: 1 }),
    span: {
      duration: 'test-duration',
      hasChildren: true,
      process: {
        serviceName: 'service-name',
      },
      spanID,
      logs: [],
      references: [],
    },
  };

  let wrapper;

  beforeEach(() => {
    props.onDetailToggled.mockReset();
    props.onChildrenToggled.mockReset();
    render(<SpanBarRow {...props} />);
  });

  it('renders without exploding', () => {
    expect(() => render(<SpanBarRow {...props} />)).not.toThrow();
  });

  it('escalates detail toggling', () => {
    const { onDetailToggled } = props;
    expect(onDetailToggled.mock.calls.length).toBe(0);
    fireEvent.click(screen.getByTestId('span-view'));
    expect(onDetailToggled.mock.calls).toEqual([[spanID]]);
  });

  it('escalates children toggling', () => {
    const { onChildrenToggled } = props;
    expect(onChildrenToggled.mock.calls.length).toBe(0);
    fireEvent.click(screen.getByTestId('span-tree-offset'));
    expect(onChildrenToggled.mock.calls).toEqual([[spanID]]);
  });

  it('render references button', () => {
    const newSpan = Object.assign({}, props.span);
    const span = Object.assign(newSpan, {
      references: [
        {
          refType: 'FOLLOWS_FROM',
          traceID: 'trace1',
          spanID: 'span0',
          span: {
            spanID: 'span0',
          },
        },
        {
          refType: 'FOLLOWS_FROM',
          traceID: 'otherTrace',
          spanID: 'span1',
          span: {
            spanID: 'span1',
          },
        },
      ],
    });

    render(
      <SpanBarRow
        {...props}
        span={span}
        createSpanLink={() => ({
          traceLinks: [{ href: 'href' }, { href: 'href' }],
        })}
      />
    );
    expect(screen.getAllByTestId('span-row')).toHaveLength(1);
  });

  it('render referenced to by single span', () => {
    const span = Object.assign(
      {
        subsidiarilyReferencedBy: [
          {
            refType: 'FOLLOWS_FROM',
            traceID: 'trace1',
            spanID: 'span0',
            span: {
              spanID: 'span0',
            },
          },
        ],
      },
      props.span
    );
    render(
      <SpanBarRow
        {...props}
        span={span}
        createSpanLink={() => ({
          traceLinks: [{ content: 'This span is referenced by another span', href: 'href' }],
        })}
      />
    );
    expect(screen.getByRole('link', { name: 'This span is referenced by another span' })).toBeInTheDocument();
  });

  it('render referenced to by multiple span', () => {
    const span = Object.assign(
      {
        subsidiarilyReferencedBy: [
          {
            refType: 'FOLLOWS_FROM',
            traceID: 'trace1',
            spanID: 'span0',
            span: {
              spanID: 'span0',
            },
          },
          {
            refType: 'FOLLOWS_FROM',
            traceID: 'trace1',
            spanID: 'span1',
            span: {
              spanID: 'span1',
            },
          },
        ],
      },
      props.span
    );
    render(
      <SpanBarRow
        {...props}
        span={span}
        createSpanLink={() => ({
          traceLinks: [{ href: 'href' }, { href: 'href' }],
        })}
      />
    );
    expect(screen.getAllByTestId('span-row')).toHaveLength(1);
  });
});
