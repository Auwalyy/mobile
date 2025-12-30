import { Stack } from 'expo-router';
import { SocketProvider } from '../../context/SocketContext';

export default function CustomerLayout() {
  return (
    <SocketProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
       
      </Stack>
    </SocketProvider>
  );
}

