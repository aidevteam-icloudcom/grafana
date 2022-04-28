// Copyright (c) 2019 Uber Technologies, Inc.
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

import * as copy from 'copy-to-clipboard';
import { shallow } from 'enzyme';
import React from 'react';

import { Button, Tooltip } from '@grafana/ui';

import CopyIcon from './CopyIcon';

jest.mock('copy-to-clipboard');

describe('<CopyIcon />', () => {
  const props = {
    className: 'classNameValue',
    copyText: 'copyTextValue',
    tooltipTitle: 'tooltipTitleValue',
  };
  let copySpy;
  let wrapper;

  beforeAll(() => {
    copySpy = jest.spyOn(copy, 'default');
  });

  beforeEach(() => {
    copySpy.mockReset();
    wrapper = shallow(<CopyIcon {...props} />);
  });

  it('renders as expected', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('updates state and copies when clicked', () => {
    expect(wrapper.state().hasCopied).toBe(false);
    expect(copySpy).not.toHaveBeenCalled();

    wrapper.find(Button).simulate('click');
    expect(wrapper.state().hasCopied).toBe(true);
    expect(copySpy).toHaveBeenCalledWith(props.copyText);
  });

  it('persists state when tooltip opens', () => {
    wrapper.setState({ hasCopied: true });
    expect(wrapper.state().hasCopied).toBe(true);
  });
});
