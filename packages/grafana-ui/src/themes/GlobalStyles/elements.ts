import { css } from '@emotion/react';
import { GrafanaThemeV2, ThemeTypographyVariant } from '@grafana/data';

export function getVariantStyles(variant: ThemeTypographyVariant) {
  return `
    margin: 0;
    font-size: ${variant.fontSize};    
    line-height: ${variant.lineHeight};
    font-weight: ${variant.fontWeight};
    letter-spacing: ${variant.letterSpacing};
    font-family: ${variant.fontFamily};
    margin-bottom: 0.35em;
  `;
}

export function getElementStyles(theme: GrafanaThemeV2) {
  return css`
    h1,
    .h1 {
      ${getVariantStyles(theme.typography.h1)}
    }
    h2,
    .h2 {
      ${getVariantStyles(theme.typography.h2)}
    }
    h3,
    .h3 {
      ${getVariantStyles(theme.typography.h3)}
    }
    h4,
    .h4 {
      ${getVariantStyles(theme.typography.h4)}
    }
    h5,
    .h5 {
      ${getVariantStyles(theme.typography.h5)}
    }
    h6,
    .h6 {
      ${getVariantStyles(theme.typography.h6)}
    }

    p {
      margin: 0 0 ${theme.spacing(2)};
    }

    // Ex: 14px base font * 85% = about 12px
    small {
      font-size: ${theme.typography.bodySmall.fontSize};
    }

    b,
    strong {
      font-weight: ${theme.typography.fontWeightMedium};
    }

    em {
      font-style: italic;
      color: ${theme.palette.text.primary};
    }

    cite {
      font-style: normal;
    }

    // Utility classes
    .muted {
      color: ${theme.palette.text.secondary};
    }

    a.muted:hover,
    a.muted:focus {
      color: ${theme.palette.text.primary};
    }

    .text-warning {
      color: ${theme.palette.warning.text};

      &:hover,
      &:focus {
        color: ${theme.palette.emphasize(theme.palette.warning.text, 0.15)};
      }
    }

    .text-error {
      color: ${theme.palette.error.text};

      &:hover,
      &:focus {
        color: ${theme.palette.emphasize(theme.palette.error.text, 0.15)};
      }
    }

    .text-success {
      color: $success-text-color;

      &:hover,
      &:focus {
        color: ${theme.palette.emphasize(theme.palette.success.text, 0.15)};
      }
    }

    a {
      cursor: pointer;
      color: ${theme.palette.text.link};
      text-decoration: none;

      &:hover {
        color: ${theme.palette.emphasize(theme.palette.text.link, 0.15)};
        text-decoration: underline;
      }

      &:focus {
        outline: 0 none !important;
      }

      &: [disabled] {
        cursor: default;
        pointer-events: none !important;
      }
    }

    .text-left {
      text-align: left;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }
  `;
}
