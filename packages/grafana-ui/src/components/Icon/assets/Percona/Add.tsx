import React, { FunctionComponent } from 'react';

import { SvgProps } from '../types';

export const PerconaAdd: FunctionComponent<SvgProps> = ({ size, ...rest }) => {
  return (
    <svg width={size} height={size} {...rest} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.9655 1.58789C6.16682 1.58789 1.46613 6.28859 1.46613 12.0873C1.46613 17.8859 6.16682 22.5866 11.9655 22.5866C17.7641 22.5866 22.4648 17.8859 22.4648 12.0873C22.4648 6.28859 17.7641 1.58789 11.9655 1.58789ZM16.0671 12.8059H12.6747V16.1736C12.6747 16.5702 12.3532 16.8917 11.9565 16.8917C11.7582 16.8917 11.5787 16.8114 11.4487 16.6814C11.3187 16.5514 11.2384 16.3719 11.2384 16.1736V12.8059H7.87073C7.47402 12.8059 7.1526 12.4844 7.1526 12.0877C7.1526 11.8894 7.23285 11.7098 7.36286 11.5798C7.49284 11.4499 7.6724 11.3696 7.87073 11.3696H11.2384V7.97714C11.2384 7.58046 11.5599 7.25904 11.9566 7.25904C12.1549 7.25904 12.3344 7.33926 12.4645 7.46927C12.5944 7.59928 12.6747 7.77881 12.6747 7.97714V11.3696H16.0672C16.4639 11.3696 16.7853 11.691 16.7853 12.0877C16.7852 12.4844 16.4638 12.8059 16.0671 12.8059Z"
        fill="#9FA7B3"
      />
    </svg>
  );
};
