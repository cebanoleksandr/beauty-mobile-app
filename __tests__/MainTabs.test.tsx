import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { UserContext } from '../src/api';
import { MainTabs } from '../src/navigation/MainTabs';
import { clearClient, renderScreen, stubFetch, texts } from '../test-utils/screen';

afterEach(clearClient);

const Stack = createNativeStackNavigator();

async function renderFor(context: UserContext) {
  stubFetch(({ url }) =>
    url.endsWith('/api/user/me')
      ? {
          body: {
            id: 1,
            firstName: 'A',
            context,
            isAdmin: true,
            masterProfile: null,
            telegramLinked: false,
          },
        }
      : undefined,
  );
  return renderScreen(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

const tabLabels = (tree: Awaited<ReturnType<typeof renderFor>>) =>
  tree.root
    .findAll(n => n.props.accessibilityRole === 'tab' && typeof n.props.onPress === 'function')
    .map(n => n.props.accessibilityLabel);

test.each<[UserContext, string[]]>([
  ['CLIENT', ['Map', 'Bookings', 'Favorites', 'Profile']],
  ['MASTER', ['Calendar', 'Bookings', 'Clients', 'Services', 'Profile']],
  ['ADMIN', ['Requests', 'Reports', 'Stats', 'Users', 'Profile']],
])('%s mode shows its own tabs', async (context, labels) => {
  const tree = await renderFor(context);
  expect(tabLabels(tree)).toEqual(labels);
  expect(texts(tree).length).toBeGreaterThan(0);
});
