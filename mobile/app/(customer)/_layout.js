// app/(customer)/_layout.js - MINIMAL VERSION
import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../utils/constants';
import { AuthProvider } from '../../context/AuthContext';

export default function CustomerLayout() {
  return (
   <AuthProvider>
     <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
   </AuthProvider>
  );
}