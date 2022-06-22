import React, { FC } from 'react';

import { Connect } from './Connect/Connect';
import { Connected } from './Connected/Connected';
import { PlatformProps } from './types';

export const Platform: FC<PlatformProps> = ({ isConnected }) => (isConnected ? <Connected /> : <Connect />);
