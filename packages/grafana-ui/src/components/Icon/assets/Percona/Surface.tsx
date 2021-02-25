import React, { FunctionComponent } from 'react';

import { SvgProps } from '../types';

export const PerconaSurface: FunctionComponent<SvgProps> = ({ size, ...rest }) => {
  return (
    <svg width={size} height={size} {...rest} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 0C5.38226 0 0 5.38226 0 12C0 18.6177 5.38226 24 12 24C18.6177 24 24 18.6177 24 12C24 5.38226 18.6177 0 12 0ZM12 2.6087C17.1866 2.6087 21.3913 6.81339 21.3913 12C21.3913 17.1866 17.1866 21.3913 12 21.3913C6.81339 21.3913 2.6087 17.1866 2.6087 12C2.6087 6.81339 6.81339 2.6087 12 2.6087ZM12.4727 3.66835C12.059 4.67739 11.5904 6.35478 11.4944 8.91861C11.6598 8.892 11.8283 8.86957 12 8.86957C12.1852 8.86957 12.3605 8.88783 12.5379 8.91861C12.6438 6.23217 13.1697 4.62626 13.549 3.79878C13.1963 3.73148 12.8395 3.68922 12.4727 3.66835ZM10.2882 3.83165C9.92922 3.90678 9.58487 4.00487 9.2447 4.12487C9.24887 5.2153 9.4607 6.93548 10.3534 9.34226C10.6492 9.15775 10.9744 9.0254 11.315 8.95096C10.3837 6.42417 10.2532 4.74052 10.2882 3.83165ZM15.6193 4.48383C14.8513 5.256 13.7875 6.61983 12.7174 8.95096C13.059 9.03113 13.3844 9.16912 13.6795 9.35896C14.8043 6.91722 15.899 5.64157 16.5652 5.02174C16.2623 4.82154 15.9463 4.64183 15.6193 4.48383ZM7.30435 5.10261C7.00278 5.3087 6.71113 5.54504 6.44035 5.78765C6.86191 6.79461 7.71391 8.29409 9.45652 10.1734C9.66405 9.88883 9.91762 9.6409 10.2068 9.43983C8.38226 7.46504 7.62209 5.9567 7.30435 5.10261ZM18.2118 6.43983C17.2049 6.86139 15.7054 7.71339 13.8261 9.456C14.1115 9.66209 14.3583 9.91878 14.5597 10.2063C16.5344 8.38017 18.0428 7.62156 18.8969 7.30383C18.6875 7.0013 18.4586 6.71269 18.2118 6.43983ZM5.02174 7.43478C4.82154 7.73774 4.64183 8.05375 4.48383 8.3807C5.25809 9.14869 6.61983 10.2125 8.95096 11.2826C9.03113 10.941 9.16912 10.6156 9.35896 10.3205C6.91722 9.19565 5.64157 8.10104 5.02174 7.43478ZM19.8751 9.2447C18.7847 9.24887 17.0645 9.4607 14.6577 10.3534C14.8414 10.6496 14.9737 10.9747 15.049 11.315C17.5758 10.3837 19.2595 10.2532 20.1683 10.2882C20.0939 9.93422 19.9959 9.58563 19.8751 9.2447ZM12 9.91304C10.847 9.91304 9.91304 10.847 9.91304 12C9.91304 13.153 10.847 14.087 12 14.087C13.153 14.087 14.087 13.153 14.087 12C14.087 10.847 13.153 9.91304 12 9.91304ZM3.79878 10.451C3.73148 10.8037 3.68922 11.1605 3.66835 11.5273C4.67739 11.941 6.35478 12.4096 8.91861 12.5056C8.88886 12.3386 8.87246 12.1696 8.86957 12C8.86957 11.8148 8.88783 11.6395 8.91861 11.4621C6.23217 11.3562 4.62626 10.8303 3.79878 10.451ZM15.0814 11.4944C15.108 11.6598 15.1304 11.8283 15.1304 12C15.1304 12.1852 15.1122 12.3605 15.0814 12.5379C17.7678 12.6438 19.3737 13.1697 20.2012 13.549C20.2685 13.1963 20.3108 12.8395 20.3317 12.4727C19.3226 12.059 17.6452 11.5925 15.0814 11.4944ZM8.95096 12.685C6.42417 13.6163 4.74052 13.7468 3.83165 13.7118C3.90678 14.0708 4.00487 14.413 4.12487 14.7553C5.2153 14.7511 6.94174 14.5351 9.34226 13.6466C9.15895 13.3502 9.02667 13.0252 8.95096 12.685ZM15.049 12.7174C14.968 13.0587 14.8301 13.3839 14.641 13.6795C17.0828 14.8043 18.3584 15.899 18.9783 16.5652C19.1781 16.2637 19.3576 15.9475 19.5162 15.6193C18.7419 14.8513 17.3807 13.7875 15.049 12.7174ZM9.44035 13.7937C7.46557 15.6198 5.95722 16.38 5.10313 16.6957C5.30922 16.9972 5.54557 17.2889 5.78817 17.5597C6.79513 17.1402 8.29461 16.2861 10.1739 14.5435C9.88935 14.336 9.64142 14.0824 9.44035 13.7932V13.7937ZM14.5435 13.8261C14.336 14.1107 14.0824 14.3586 13.7932 14.5597C15.6193 16.5344 16.38 18.0428 16.6957 18.8969C16.9978 18.687 17.2864 18.4582 17.5597 18.2118C17.1402 17.2049 16.2882 15.7075 14.5435 13.8261ZM10.3205 14.6416C9.19565 17.0833 8.10104 18.359 7.43478 18.9783C7.73635 19.1781 8.05252 19.3576 8.3807 19.5162C9.14869 18.744 10.2125 17.3807 11.2826 15.049C10.9413 14.968 10.6161 14.8301 10.3205 14.641V14.6416ZM13.6466 14.6572C13.3508 14.8417 13.0256 14.9741 12.685 15.0485C13.6163 17.5763 13.7468 19.2595 13.7118 20.1683C14.0658 20.0939 14.4144 19.9959 14.7553 19.8751C14.7511 18.7847 14.5393 17.0645 13.6466 14.6577V14.6572ZM11.4621 15.0814C11.3562 17.7678 10.8303 19.3737 10.451 20.2012C10.8037 20.2685 11.1605 20.3108 11.5273 20.3317C11.941 19.3226 12.4096 17.6452 12.5056 15.0814C12.3386 15.1111 12.1696 15.1275 12 15.1304C11.8148 15.1304 11.6395 15.1122 11.4621 15.0814Z"
        fill="#9FA7B3"
      />
    </svg>
  );
};
