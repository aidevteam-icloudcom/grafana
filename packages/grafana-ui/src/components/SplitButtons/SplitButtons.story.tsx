import React from 'react';
import { SplitButtons } from './SplitButtons';
import { withCenteredStory, withHorizontallyCenteredStory } from '../../utils/storybook/withCenteredStory';
import mdx from './SplitButtons.mdx';
import { Button, LinkButton } from '../Forms/Button';
import { ButtonSelect } from '../Forms/Select/ButtonSelect';
import { cx } from 'emotion';

export default {
  title: 'General/SplitButtons',
  component: SplitButtons,
  decorators: [withCenteredStory, withHorizontallyCenteredStory],
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

export const simple = () => (
  <SplitButtons>
    <Button>First</Button>
    <LinkButton>Second</LinkButton>
    <Button>Third</Button>
    <LinkButton>Fourth</LinkButton>
    <ButtonSelect onChange={() => {}} placeholder="Awesome" />
  </SplitButtons>
);
