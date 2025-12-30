import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext'; // Add this import

export default function RootLayout() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(rider)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="index" />
        </Stack>
      </SocketProvider>
    </AuthProvider>
  );
}