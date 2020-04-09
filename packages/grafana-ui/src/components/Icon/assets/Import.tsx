import React, { FunctionComponent } from 'react';
import { SvgProps } from '../Icon';

export const Import: FunctionComponent<SvgProps> = ({ size, ...rest }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      enableBackground="new 0 0 24 24"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      {...rest}
    >
      <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24">
        <path d="M19,22H5c-1.65611-0.00181-2.99819-1.34389-3-3v-4c0-0.55229,0.44772-1,1-1s1,0.44771,1,1v4c0.00037,0.55213,0.44787,0.99963,1,1h14c0.55213-0.00037,0.99963-0.44787,1-1v-4c0-0.55229,0.44772-1,1-1s1,0.44771,1,1v4C21.99819,20.65611,20.65611,21.99819,19,22z" />
        <path
          opacity="0.6"
          d="M16.707,10.293c-0.39027-0.39048-1.02319-0.39065-1.41368-0.00038c-0.00013,0.00013-0.00026,0.00026-0.00038,0.00038L13,12.58594V3c0-0.55228-0.44771-1-1-1s-1,0.44772-1,1v9.58594L8.707,10.293c-0.39402-0.38691-1.02709-0.38116-1.414,0.01286c-0.38195,0.38896-0.38195,1.01218,0,1.40114l4,4c0.39028,0.39048,1.02321,0.39065,1.41369,0.00037c0.00012-0.00012,0.00025-0.00025,0.00037-0.00037l4-4c0.39045-0.3903,0.39058-1.02322,0.00028-1.41367C16.70723,10.29322,16.70712,10.29311,16.707,10.293z"
        />
      </svg>
    </svg>
  );
};
