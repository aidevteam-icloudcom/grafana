import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { SegmentInput } from '.';

const SegmentFrame = ({ children }: any) => (
  <>
    <div className="gf-form-inline">
      <div className="gf-form">
        <span className="gf-form-label width-8 query-keyword">Segment Name</span>
      </div>
      {children}
    </div>
  </>
);

export const BasicInput = () => {
  const [value, setValue] = useState('some text');
  return (
    <SegmentFrame>
      <SegmentInput
        value={value}
        onChange={text => {
          setValue(text as string);
          action('Segment value changed')(text);
        }}
      />
    </SegmentFrame>
  );
};

export default {
  title: 'Panel/Segment/SegmentInput',
  component: BasicInput,
};

export const BasicInputWithPlaceholder = () => {
  const [value, setValue] = useState('');
  return (
    <SegmentFrame>
      <SegmentInput
        placeholder="add text"
        value={value}
        onChange={text => {
          setValue(text as string);
          action('Segment value changed')(text);
        }}
      />
    </SegmentFrame>
  );
};

const InputComponent = ({ initialValue }: any) => {
  const [value, setValue] = useState(initialValue);
  return (
    <SegmentInput
      placeholder="add text"
      autofocus
      value={value}
      onChange={text => {
        setValue(text as string);
        action('Segment value changed')(text);
      }}
    />
  );
};

export const InputWithAutoFocus = () => {
  const [inputComponents, setInputComponents] = useState<any>([]);
  return (
    <SegmentFrame>
      {inputComponents.map((InputComponent: any) => (
        <InputComponent intitialValue="test"></InputComponent>
      ))}
      <a
        className="gf-form-label query-part"
        onClick={() => {
          setInputComponents([...inputComponents, InputComponent]);
        }}
      >
        <i className="fa fa-plus" />
      </a>
    </SegmentFrame>
  );
};
