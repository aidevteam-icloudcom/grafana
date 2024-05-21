const noAriaLabelSelectors = require('./rules/no-aria-label-e2e-selectors.cjs');
const noBorderRadiusLiteral = require('./rules/no-border-radius-literal.cjs');
const noUnreducedMotion = require('./rules/no-unreduced-motion.cjs');
const noUntranslatedLiterals = require('./rules/no-untranslated-literals.cjs');
const themeTokenUsage = require('./rules/theme-token-usage.cjs');

module.exports = {
  rules: {
    'no-unreduced-motion': noUnreducedMotion,
    'no-aria-label-selectors': noAriaLabelSelectors,
    'no-border-radius-literal': noBorderRadiusLiteral,
    'theme-token-usage': themeTokenUsage,
    'no-untranslated-literals': noUntranslatedLiterals,
  },
};
