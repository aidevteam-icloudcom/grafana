import { mount } from 'enzyme';
import React from 'react';

import { dateTime, TimeRange } from '@grafana/data';
import { setTemplateSrv } from '@grafana/runtime';

import { getLinkSrv, LinkService, LinkSrv, setLinkSrv } from '../../../../features/panel/panellinks/link_srv';

import { DebugSection } from './DebugSection';

// We do not need more here and TimeSrv is hard to setup fully.
jest.mock('app/features/dashboard/services/TimeSrv', () => ({
  getTimeSrv: () => ({
    timeRangeForUrl() {
      const from = dateTime().subtract(1, 'h');
      const to = dateTime();
      return { from, to, raw: { from, to } };
    },
  }),
}));

describe('DebugSection', () => {
  let originalLinkSrv: LinkService;

  // This needs to be setup so we can test interpolation in the debugger
  beforeAll(() => {
    const linkService = new LinkSrv();
    originalLinkSrv = getLinkSrv();
    setLinkSrv(linkService);
  });

  beforeEach(() => {
    setTemplateSrv({
      replace(target, scopedVars, format) {
        return target ?? '';
      },
      getVariables() {
        return [];
      },
      containsTemplate() {
        return false;
      },
      updateTimeRange(timeRange: TimeRange) {},
      reevaluateVariable() {},
    });
  });

  afterAll(() => {
    setLinkSrv(originalLinkSrv);
  });

  it('does not render any field if no debug text', () => {
    const wrapper = mount(<DebugSection derivedFields={[]} />);
    expect(wrapper.find('DebugFieldItem').length).toBe(0);
  });

  it('does not render any field if no derived fields', () => {
    const wrapper = mount(<DebugSection derivedFields={[]} />);
    const textarea = wrapper.find('textarea');
    (textarea.getDOMNode() as HTMLTextAreaElement).value = 'traceId=1234';
    textarea.simulate('change');
    expect(wrapper.find('DebugFieldItem').length).toBe(0);
  });

  it('renders derived fields', () => {
    const derivedFields = [
      {
        matcherRegex: 'traceId=(\\w+)',
        name: 'traceIdLink',
        url: 'http://localhost/trace/${__value.raw}',
      },
      {
        matcherRegex: 'traceId=(\\w+)',
        name: 'traceId',
      },
      {
        matcherRegex: 'traceId=(',
        name: 'error',
      },
    ];

    const wrapper = mount(<DebugSection derivedFields={derivedFields} />);
    const textarea = wrapper.find('textarea');
    (textarea.getDOMNode() as HTMLTextAreaElement).value = 'traceId=1234';
    textarea.simulate('change');

    expect(wrapper.find('table').length).toBe(1);
    // 3 rows + one header
    expect(wrapper.find('tr').length).toBe(4);
    expect(wrapper.find('tr').at(1).contains('http://localhost/trace/${__value.raw}')).toBeTruthy();
  });
});
