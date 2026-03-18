import { render } from '@testing-library/react-native';
import type React from 'react';
import { Text } from 'react-native';

jest.mock('../require.context', () => ({
  context: {},
}));

jest.mock('@apps-in-toss/framework', () => ({
  AppsInToss: {
    registerApp: jest.fn((component: unknown) => component),
  },
}));

jest.mock('@toss/tds-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockProvider = ({
    children,
  }: {
    children: React.ReactNode;
  }) => <View testID="tds-provider">{children}</View>;

  return {
    TDSProvider: MockProvider,
  };
});

import AppContainer from './_app';

describe('AppContainer', () => {
  it('wraps children with TDSProvider', () => {
    const RegisteredApp =
      AppContainer as React.ComponentType<React.PropsWithChildren>;
    const screen = render(
      <RegisteredApp>
        <Text>miniapp</Text>
      </RegisteredApp>,
    );

    expect(screen.getByTestId('tds-provider')).toBeTruthy();
    expect(screen.getByText('miniapp')).toBeTruthy();
  });
});
