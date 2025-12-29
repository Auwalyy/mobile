
// app/(rider)/_layout.js
import React from 'react';
import { Stack } from 'expo-router';
import { Tabs } from 'expo-router';
import { COLORS } from '../../utils/constants';

export default function RiderLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="delivery-details" 
        options={{
          headerShown: true,
          headerTitle: 'Delivery Details',
          headerStyle: {
            backgroundColor: COLORS.white,
          },
          headerTintColor: COLORS.primary,
        }}
      />
    </Stack>
  );
}
 