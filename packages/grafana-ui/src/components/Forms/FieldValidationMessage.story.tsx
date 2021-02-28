import React from 'react';
import { text } from '@storybook/addon-knobs';
import { FieldValidationMessage } from './FieldValidationMessage';
import mdx from './FieldValidationMessage.mdx';

const getKnobs = () => {
  return {
    message: text('message', 'Invalid input message'),
  };
};

export default {
  title: 'Forms/FieldValidationMessage',
  component: FieldValidationMessage,
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

export const vertical = () => {
  const { message } = getKnobs();

  return <FieldValidationMessage>{message}</FieldValidationMessage>;
};

export const horizontal = () => {
  const { message } = getKnobs();

  return <FieldValidationMessage horizontal>{message}</FieldValidationMessage>;
};
