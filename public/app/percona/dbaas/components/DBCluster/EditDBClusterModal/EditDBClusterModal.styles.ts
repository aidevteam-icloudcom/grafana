import { css } from '@emotion/css';

export const getStyles = () => ({
  modalWrapper: css`
    div[data-testid='modal-body'] {
      left: 25%;
      top: 6%;
      width: 50%;
      max-width: none;
    }
  `,
});
