import React, { ReactNode } from 'react';

import { t } from '../../utils/i18n';
import { Box } from '../Layout/Box/Box';
import { Stack } from '../Layout/Stack/Stack';
import { Text } from '../Text/Text';

import { GrotNotFound } from './GrotNotFound/GrotNotFound';

interface BaseProps {
  /**
   * Provide a button to render below the message
   */
  button?: ReactNode;
  hideImage?: boolean;
  /**
   * Override the default image for the variant
   */
  image?: ReactNode;
  /**
   * Message to display to the user
   */
  message?: string;
  /**
   * Which variant to use. Affects the default message and image shown.
   */
  variant: 'initial' | 'search';
}

interface InitialVariantProps extends BaseProps {
  message: string;
  variant: 'initial';
}

interface SearchVariantProps extends BaseProps {
  variant: 'search';
}

type Props = InitialVariantProps | SearchVariantProps;

export const EmptyState = ({
  button,
  children,
  image,
  message,
  hideImage = false,
  variant,
}: React.PropsWithChildren<Props>) => {
  const imageToShow = image ?? getImageForVariant(variant);
  const messageToShow = message ?? getMessageForVariant(variant);

  return (
    <Box paddingY={4} gap={4} display="flex" direction="column" alignItems="center">
      {!hideImage && imageToShow}
      <Stack direction="column" alignItems="center">
        <Text variant="h4">{messageToShow}</Text>
        {children && <Text color="secondary">{children}</Text>}
      </Stack>
      {button}
    </Box>
  );
};

function getMessageForVariant(variant: Props['variant']) {
  switch (variant) {
    case 'initial': {
      return t('grafana-ui.empty-state.initial-message', "You haven't created anything yet");
    }
    case 'search': {
      return t('grafana-ui.empty-state.search-message', 'No results found');
    }
    default: {
      throw new Error(`Unknown variant: ${variant}`);
    }
  }
}

function getImageForVariant(variant: Props['variant']) {
  switch (variant) {
    case 'initial': {
      // TODO replace with a different image for initial variant
      return <GrotNotFound width={300} />;
    }
    case 'search': {
      return <GrotNotFound width={300} />;
    }
    default: {
      throw new Error(`Unknown variant: ${variant}`);
    }
  }
}
