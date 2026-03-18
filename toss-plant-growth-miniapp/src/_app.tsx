import './runtime/polyfills';
import { AppsInToss } from '@apps-in-toss/framework';
import type { InitialProps } from '@granite-js/react-native';
import { TDSProvider } from '@toss/tds-react-native';
import React, { type PropsWithChildren } from 'react';
import { context } from '../require.context';

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return <TDSProvider>{children}</TDSProvider>;
}

export default AppsInToss.registerApp(AppContainer, {
  context,
});
